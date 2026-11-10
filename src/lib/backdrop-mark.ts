// /v2: a big black-chrome B behind the home column, shown at a whisper
// (the canvas sits at ~7% opacity), slowly turning, tilting a touch with the
// pointer and swinging with the column as it scrolls.
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import glyphs from './monogram-b.json';

export function mountBackdropMark() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-backdrop]');
  if (!canvas) return;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 1.25;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-3, 4, 6);
  scene.add(key);

  const mat = new THREE.MeshPhysicalMaterial({ color: 0x16161a, roughness: 0.2, metalness: 1, clearcoat: 1, clearcoatRoughness: 0.05 });
  const U = glyphs.upm;
  const [d] = glyphs.g.B as [string, number[], number];
  const shapes = new SVGLoader()
    .parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`)
    .paths.flatMap((p) => p.toShapes(true));
  const geo = new THREE.ExtrudeGeometry(shapes, { depth: 150, bevelEnabled: true, bevelThickness: 22, bevelSize: 6, bevelSegments: 6, curveSegments: 28 });
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
  geo.scale(3.1 / U, 3.1 / U, 3.1 / U);
  const B = new THREE.Mesh(geo, mat);
  scene.add(B);

  // fills ~85% of the screen height (more of the width on phones)
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    camera.position.z = w < h ? 8 : 5.2;
  };
  addEventListener('resize', resize);
  resize();

  let px = 0;
  let py = 0;
  addEventListener('pointermove', (e) => {
    px = (e.clientX / innerWidth) * 2 - 1;
    py = (e.clientY / innerHeight) * 2 - 1;
  });
  const list = document.querySelector<HTMLElement>('.vh__list');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rx = 0;
  let ry = 0;
  let lastY = 0;
  let swing = 0;
  const t0 = performance.now();
  const tick = () => {
    const t = (performance.now() - t0) / 1000;
    // the column's travel since last frame nudges it round, then it eases back
    const m = list ? new DOMMatrix(getComputedStyle(list).transform) : null;
    const y = m ? m.m42 : 0;
    const dy = y - lastY;
    lastY = y;
    if (!calm) swing += (Math.max(-0.6, Math.min(0.6, dy * 0.004)) - swing) * 0.06;
    const idle = calm ? 0 : Math.sin(t * 0.25) * 0.3;
    ry += (idle + px * 0.25 + swing * 3 - ry) * 0.04;
    rx += (py * 0.15 - rx) * 0.04;
    B.rotation.set(rx, ry, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  tick();
  // fade in once the column has arrived
  const on = () => setTimeout(() => canvas.classList.add('is-on'), 300);
  if (document.documentElement.classList.contains('is-preloading')) addEventListener('preload:done', on, { once: true });
  else on();
}
