import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';

let logger: ReturnType<LoggerProvider['getLogger']> | undefined;
let provider: LoggerProvider | undefined;
let shutdownRegistered = false;

async function settleWithin(operation: Promise<unknown>, timeoutMs: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      operation.catch(() => {}),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, timeoutMs);
        timer.unref();
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function registerShutdown(): void {
  if (shutdownRegistered) return;
  shutdownRegistered = true;

  process.once('SIGTERM', () => {
    if (provider) void settleWithin(provider.shutdown(), 3000);
  });
}

/**
 * Creates the isolated logger used only for PostHog preview-lifecycle records.
 * It intentionally does not attach an exporter to the app's existing loggers.
 */
export function getPostHogPreviewLogger() {
  if (logger) return logger;

  const apiKey = import.meta.env.PUBLIC_POSTHOG_KEY;
  const apiHost = import.meta.env.PUBLIC_POSTHOG_HOST;
  const missingVariable = !apiKey
    ? 'PUBLIC_POSTHOG_KEY'
    : !apiHost
      ? 'PUBLIC_POSTHOG_HOST'
      : undefined;

  if (missingVariable) {
    if (import.meta.env.DEV) {
      console.warn(`${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`);
    }
    return undefined;
  }

  provider = new LoggerProvider({
    resource: resourceFromAttributes({
      'service.name': 'portfolio-preview-api',
      'deployment.environment': import.meta.env.DEV ? 'development' : 'production',
      'service.version': '1.0.0',
    }),
    processors: [
      new BatchLogRecordProcessor(
        new OTLPLogExporter({
          url: new URL('/i/v1/logs', apiHost).toString(),
          headers: { Authorization: `Bearer ${apiKey}` },
          timeoutMillis: 2000,
        }),
        { exportTimeoutMillis: 2000 },
      ),
    ],
  });
  logger = provider.getLogger('posthog.preview-lifecycle');
  registerShutdown();

  return logger;
}

export async function flushPostHogPreviewLogs(): Promise<void> {
  if (provider) await settleWithin(provider.forceFlush(), 2500);
}
