// Preloader lab: the black-chrome B drawn into a canvas, posed every frame by
// the page (pose(ms) → rotation), so each variant can choreograph its 3D turn.
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import glyphs from './monogram-b.json';

export type Pose = { rx: number; ry: number; rz?: number };

export function mountMark(canvas: HTMLCanvasElement, pose: (ms: number) => Pose, opts: { z?: number; color?: number } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 1.25;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, opts.z ?? 7.4);
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-3, 4, 6);
  scene.add(key);
  const mat = new THREE.MeshPhysicalMaterial({ color: opts.color ?? 0x16161a, roughness: 0.18, metalness: 1, clearcoat: 1, clearcoatRoughness: 0.05 });
  const U = glyphs.upm;
  const [d] = glyphs.g.B as [string, number[], number];
  const shapes = new SVGLoader()
    .parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`)
    .paths.flatMap((p) => p.toShapes(true));
  const geo = new THREE.ExtrudeGeometry(shapes, { depth: 150, bevelEnabled: true, bevelThickness: 22, bevelSize: 6, bevelSegments: 5, curveSegments: 20 });
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
  geo.scale(3.1 / U, 3.1 / U, 3.1 / U);
  const B = new THREE.Mesh(geo, mat);
  scene.add(B);
  const size = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', size);
  size();
  const t0 = performance.now();
  const tick = () => {
    const p = pose(performance.now() - t0);
    B.rotation.set(p.rx, p.ry, p.rz ?? 0);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  tick();
}

import { quartOut, inOut } from './ease';
export { quartOut, inOut };
/** the usual turn: in from three-quarters, a gentle rock, a half spin away from `out` ms */
export const turn = (out: number, outDur = 600) => (ms: number): Pose => {
  const t = ms / 1000;
  const k = quartOut(ms / 1100);
  const o = inOut((ms - out) / outDur);
  return { rx: Math.sin(t * 1.1) * 0.07 + o * 0.25, ry: (1 - k) * -1.9 + Math.sin(t * 1.5) * 0.22 * k + o * Math.PI };
};
