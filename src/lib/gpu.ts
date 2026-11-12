// Is there a real graphics card behind WebGL? Software renderers (SwiftShader,
// llvmpipe — what Lighthouse/PageSpeed and some VMs and old machines use)
// run every shader on the CPU and freeze the page, so the WebGL effects step
// aside for the plain picture versions there. Asked once per page.
let cached: boolean | undefined;
export function hasGPU(): boolean {
  if (cached !== undefined) return cached;
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl', { failIfMajorPerformanceCaveat: true }) ||
      c.getContext('experimental-webgl', { failIfMajorPerformanceCaveat: true })) as WebGLRenderingContext | null;
    if (!gl) return (cached = false);
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    cached = !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch {
    cached = false;
  }
  return cached;
}
