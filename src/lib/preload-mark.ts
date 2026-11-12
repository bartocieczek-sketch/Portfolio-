// The black-chrome B in the preloader. Same glyph and material as the
// /logo-b monogram: it turns in to face you, rocks gently, then spins away
// as the preloader leaves. Everything is disposed once the preloader is gone.
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import glyphs from './monogram-b.json';
import { hasGPU } from './gpu';

export function mountPreloadMark() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-preload-mark]');
  if (!canvas || !document.documentElement.classList.contains('is-preloading')) return;
  // no real GPU: a flat B in its place, no 3D
  if (!hasGPU()) {
    const [d, b] = glyphs.g.B as [string, number[], number];
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `${b[0]} ${-b[3]} ${b[2] - b[0]} ${b[3] - b[1]}`);
    svg.setAttribute('class', canvas.className);
    svg.setAttribute('data-preload-mark', '');
    svg.style.padding = '22%';
    svg.style.boxSizing = 'border-box';
    svg.innerHTML = `<path transform="scale(1,-1)" d="${d}" fill="currentColor"/>`;
    canvas.replaceWith(svg);
    dispatchEvent(new Event('preload:mark-ready'));
    return;
  }

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth || 140, canvas.clientHeight || 140, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 1.25;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 7.4);
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-3, 4, 6);
  scene.add(key);

  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x16161a,
    roughness: 0.18,
    metalness: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
  const U = glyphs.upm;
  const [d] = glyphs.g.B as [string, number[], number];
  const shapes = new SVGLoader()
    .parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`)
    .paths.flatMap((p) => p.toShapes(true));
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 150,
    bevelEnabled: true,
    bevelThickness: 22,
    bevelSize: 6,
    bevelSegments: 4,
    curveSegments: 16,
  });
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
  geo.scale(3.1 / U, 3.1 / U, 3.1 / U);
  const B = new THREE.Mesh(geo, mat);
  scene.add(B);

  // in: turned away, swings round to face you (0.75s, quart out) and rocks
  // gently; out: spins on through a half turn as it falls (0.6s, in-out)
  const quartOut = (x: number) => 1 - Math.pow(1 - x, 4);
  const inOut = (x: number) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2);
  const t0 = performance.now();
  let raf = 0;
  const tick = () => {
    const now = performance.now();
    const t = (now - t0) / 1000;
    const k = quartOut(Math.min(1, t / 0.75));
    // follow the preloader's own timeline (set up in Hero) for the exit
    const m = (window as any).__preloadMark;
    const ct = m ? Number(m.anim.currentTime ?? 0) : 0;
    const out = m ? inOut(Math.min(1, Math.max(0, (ct - m.leave) / m.out))) : 0;
    B.rotation.y = (1 - k) * -1.9 + Math.sin(t * 1.5) * 0.22 * k + out * Math.PI;
    B.rotation.x = Math.sin(t * 1.1) * 0.07 + out * 0.25;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  tick();
  dispatchEvent(new Event('preload:mark-ready'));

  const stop = () => {
    if (canvas.isConnected) return;
    cancelAnimationFrame(raf);
    geo.dispose();
    mat.dispose();
    pmrem.dispose();
    renderer.dispose();
    mo.disconnect();
  };
  const mo = new MutationObserver(stop);
  mo.observe(document.body, { childList: true, subtree: true });
}
