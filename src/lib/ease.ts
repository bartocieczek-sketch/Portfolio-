// Small easing helpers (no dependencies), shared by the 3D marks and the eggs.
export const quartOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 4);
export const inOut = (x: number) => {
  const v = Math.min(1, Math.max(0, x));
  return v < 0.5 ? 8 * v ** 4 : 1 - Math.pow(-2 * v + 2, 4) / 2;
};
