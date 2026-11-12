// A tiny 2D physics stage (Matter.js) for page elements: anything added
// becomes a box with its own size that falls, bounces, stacks and tumbles on
// the floor of the screen. The cursor is a round body that shoves things as
// it moves through them; press on a piece to pick it up and throw it.
import Matter from 'matter-js';

const { Engine, Bodies, Body, Composite, Constraint, Query } = Matter;

type Piece = { el: HTMLElement; body: Matter.Body; ox: number; oy: number };

export function createStage() {
  const engine = Engine.create({ gravity: { x: 0, y: 1.1, scale: 0.0012 } });
  const world = engine.world;
  const pieces: Piece[] = [];
  const T = 200;
  let floor: Matter.Body, left: Matter.Body, right: Matter.Body;
  const walls = () => {
    if (floor) Composite.remove(world, [floor, left, right]);
    const w = innerWidth;
    const h = innerHeight;
    floor = Bodies.rectangle(w / 2, h + T / 2, w * 3, T, { isStatic: true, friction: 0.8 });
    left = Bodies.rectangle(-T / 2, h / 2, T, h * 4, { isStatic: true });
    right = Bodies.rectangle(w + T / 2, h / 2, T, h * 4, { isStatic: true });
    Composite.add(world, [floor, left, right]);
  };
  walls();
  addEventListener('resize', walls);

  // the cursor: a round, immovable body dragged along with the pointer
  const R = 44;
  const hand = Bodies.circle(-500, -500, R, { isStatic: true });
  Composite.add(world, hand);
  let px = -500;
  let py = -500;
  addEventListener('pointermove', (e) => {
    px = e.clientX;
    py = e.clientY;
  });

  // pick up and throw
  let grab: Matter.Constraint | null = null;
  addEventListener(
    'pointerdown',
    (e) => {
      const hit = Query.point(
        pieces.map((p) => p.body),
        { x: e.clientX, y: e.clientY },
      )[0];
      if (!hit) return;
      e.preventDefault();
      e.stopPropagation();
      grab = Constraint.create({ pointA: { x: e.clientX, y: e.clientY }, bodyB: hit, pointB: { x: e.clientX - hit.position.x, y: e.clientY - hit.position.y }, stiffness: 0.12, damping: 0.08, length: 0 });
      Composite.add(world, grab);
      document.documentElement.style.cursor = 'grabbing';
    },
    { capture: true },
  );
  const drop = () => {
    if (!grab) return;
    Composite.remove(world, grab);
    grab = null;
    document.documentElement.style.cursor = '';
  };
  addEventListener('pointerup', drop);
  addEventListener('pointercancel', drop);

  let last = performance.now();
  let raf = 0;
  const step = (now: number) => {
    const dt = Math.min(32, now - last);
    last = now;
    // move the hand, carrying its speed so what it hits gets a real shove
    const hx = grab ? -500 : px;
    const hy = grab ? -500 : py;
    Body.setVelocity(hand, { x: (hx - hand.position.x) * 0.5, y: (hy - hand.position.y) * 0.5 });
    Body.setPosition(hand, { x: hx, y: hy });
    if (grab) grab.pointA = { x: px, y: py };
    Engine.update(engine, dt);
    for (const p of pieces) {
      const b = p.body;
      p.el.style.transform = `translate(${(b.position.x - p.ox).toFixed(2)}px, ${(b.position.y - p.oy).toFixed(2)}px) rotate(${b.angle.toFixed(4)}rad)`;
    }
    raf = pieces.length ? requestAnimationFrame(step) : 0;
  };
  const run = () => {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(step);
    }
  };

  return {
    /** let these elements fall from where they are */
    add(els: HTMLElement[], spin = 0.04) {
      for (const el of els) {
        el.style.transform = '';
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        el.style.transformOrigin = '50% 50%';
        el.style.willChange = 'transform';
        const ox = r.left + r.width / 2;
        const oy = r.top + r.height / 2;
        const body = Bodies.rectangle(ox, oy, r.width, r.height, {
          restitution: 0.32,
          friction: 0.6,
          frictionAir: 0.012,
          density: 0.0015,
          chamfer: { radius: Math.min(r.width, r.height) * 0.12 },
        });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * spin);
        Composite.add(world, body);
        pieces.push({ el, body, ox, oy });
      }
      run();
    },
    /** take these out of the world, gliding them home */
    restore(els: HTMLElement[]) {
      for (const el of els) {
        const k = pieces.findIndex((p) => p.el === el);
        if (k < 0) continue;
        const [p] = pieces.splice(k, 1);
        Composite.remove(world, p.body);
        const from = el.style.transform;
        el.style.transform = '';
        el.animate([{ transform: from }, { transform: 'none' }], { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      }
    },
    /** forget these (after they've been faded out) */
    remove(els: HTMLElement[]) {
      for (const el of els) {
        const k = pieces.findIndex((p) => p.el === el);
        if (k < 0) continue;
        Composite.remove(world, pieces[k].body);
        pieces.splice(k, 1);
      }
    },
  };
}
