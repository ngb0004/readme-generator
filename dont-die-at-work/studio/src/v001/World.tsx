import * as THREE from 'three';
import React, {useMemo} from 'react';
import {C} from '../engine/theme';
import {rnd} from '../engine/time';
import {D, FLANGE_R, FLANGE_T, PLAT_R, TAPE, TRAY_Y, WALL, YC, Y_BOTTOM, innerR} from './dims';

// ---------------------------------------------------------------- materials
const tex = (draw: (g: CanvasRenderingContext2D, s: number) => void, size = 512, repeat = 1) => {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

// Brushed, slightly stained plate: breaks up the CG-clean look of flat steel.
const plateTex = (seed: number, repeat: number) =>
  tex((g, s) => {
    g.fillStyle = '#8b8f96';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const x = rnd(i + seed) * s;
      const y = rnd(i * 3.1 + seed) * s;
      const l = 20 + rnd(i * 7.7 + seed) * 120;
      const v = 110 + rnd(i * 1.3 + seed) * 70;
      g.strokeStyle = `rgba(${v},${v},${v + 6},0.10)`;
      g.lineWidth = 1 + rnd(i * 5.5) * 2;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + l, y + (rnd(i * 9.1) - 0.5) * 6);
      g.stroke();
    }
    for (let i = 0; i < 46; i++) {
      const x = rnd(i * 13.3 + seed) * s;
      const y = rnd(i * 17.9 + seed) * s;
      const r = 20 + rnd(i * 4.4 + seed) * 90;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      const dark = rnd(i * 2.2) > 0.5;
      grad.addColorStop(0, dark ? 'rgba(40,36,34,0.22)' : 'rgba(200,205,215,0.12)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }, 512, repeat);

// Raised-diamond deck plate.
const deckTex = () =>
  tex((g, s) => {
    g.fillStyle = '#7d828b';
    g.fillRect(0, 0, s, s);
    const n = 16;
    const step = s / n;
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const cx = (i + 0.5) * step;
        const cy = (j + 0.5) * step;
        g.save();
        g.translate(cx, cy);
        g.rotate(((i + j) % 2 ? 1 : -1) * 0.78);
        g.fillStyle = 'rgba(190,196,206,0.55)';
        g.fillRect(-step * 0.34, -step * 0.07, step * 0.68, step * 0.14);
        g.fillStyle = 'rgba(20,22,26,0.35)';
        g.fillRect(-step * 0.34, step * 0.07, step * 0.68, step * 0.05);
        g.restore();
      }
  }, 512, 1);

const glowTex = () =>
  tex((g, s) => {
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.12, 'rgba(255,255,255,0.75)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.22)');
    grad.addColorStop(0.7, 'rgba(255,255,255,0.05)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
  }, 128);

let _m: ReturnType<typeof build> | null = null;
const build = () => {
  const plate = plateTex(1, 3);
  const plate2 = plateTex(7, 2);
  const deck = deckTex();
  deck.repeat.set(14, 14);
  return {
    glow: glowTex(),
    shell: new THREE.MeshStandardMaterial({color: '#56657d', roughness: 0.5, metalness: 0.72, map: plate, side: THREE.DoubleSide}),
    shellFar: new THREE.MeshStandardMaterial({color: '#3d4a5e', roughness: 0.62, metalness: 0.6, map: plate2}),
    cut: new THREE.MeshBasicMaterial({color: '#f2b40f', side: THREE.DoubleSide}),
    flange: new THREE.MeshStandardMaterial({color: '#6b7789', roughness: 0.42, metalness: 0.85, map: plate2}),
    stud: new THREE.MeshStandardMaterial({color: '#8d98aa', roughness: 0.34, metalness: 0.92}),
    deck: new THREE.MeshStandardMaterial({color: '#4a5566', roughness: 0.6, metalness: 0.7, map: deck, bumpMap: deck, bumpScale: 0.6, side: THREE.DoubleSide}),
    rail: new THREE.MeshStandardMaterial({color: '#d9a514', roughness: 0.5, metalness: 0.35}),
    tray: new THREE.MeshStandardMaterial({color: '#4c5666', roughness: 0.5, metalness: 0.8, map: plate2}),
    cap: new THREE.MeshStandardMaterial({color: '#5c6779', roughness: 0.42, metalness: 0.88}),
    bed: new THREE.MeshStandardMaterial({color: '#221d19', roughness: 0.95, metalness: 0.05}),
    tape: new THREE.MeshStandardMaterial({color: '#c9ced6', roughness: 0.36, metalness: 0.55, emissive: '#3b3f47', emissiveIntensity: 0.5}),
    tapeCore: new THREE.MeshStandardMaterial({color: '#9a7a4e', roughness: 0.9, side: THREE.DoubleSide}),
    redTape: new THREE.MeshStandardMaterial({color: '#e0261b', roughness: 0.55, emissive: '#7a0d06', emissiveIntensity: 0.6, side: THREE.DoubleSide}),
    dark: new THREE.MeshStandardMaterial({color: '#1c232e', roughness: 0.8, metalness: 0.4}),
    ground: new THREE.MeshStandardMaterial({color: '#0b0e13', roughness: 0.95, metalness: 0.0}),
  };
};
export const mats = () => (_m ??= build());

// ---------------------------------------------------------------- geometry
/** Trims each corner of a lathe profile so its shading stays crisp. */
const bevel = (pts: THREE.Vector2[], d = 0.012) => {
  const out: THREE.Vector2[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const a = pts[i - 1];
    const b = pts[i + 1];
    if (!a || !b) {
      out.push(p);
      continue;
    }
    const va = a.clone().sub(p);
    const vb = b.clone().sub(p);
    const sharp = va.clone().normalize().dot(vb.clone().normalize()) > -0.75;
    if (!sharp || va.length() < d * 3 || vb.length() < d * 3) {
      out.push(p);
      continue;
    }
    out.push(p.clone().add(va.setLength(d)), p.clone().add(vb.setLength(d)));
  }
  return out;
};

const V = (r: number, y: number) => new THREE.Vector2(r, y);

/** Closed (r, y) outline of the vessel wall: outside up, across the flange, inside down. */
const shellOutline = (bottom = Y_BOTTOM) => {
  const R = D.reactorR;
  const Ro = R + WALL;
  const neckIn = D.manwayR;
  const neckOut = neckIn + 0.075;
  const pts = [V(Ro, bottom), V(Ro, YC)];
  const aO = Math.acos(neckOut / Ro);
  for (let i = 1; i <= 28; i++) pts.push(V(Ro * Math.cos((aO * i) / 28), YC + Ro * Math.sin((aO * i) / 28)));
  pts.push(V(neckOut, -FLANGE_T), V(FLANGE_R, -FLANGE_T), V(FLANGE_R, 0), V(neckIn, 0));
  const aI = Math.acos(neckIn / R);
  for (let i = 28; i >= 0; i--) pts.push(V(R * Math.cos((aI * i) / 28), YC + R * Math.sin((aI * i) / 28)));
  pts.push(V(R, bottom));
  return pts;
};

const deckOutline = () => [V(FLANGE_R + 0.012, -0.11), V(PLAT_R, -0.11), V(PLAT_R, -0.02), V(FLANGE_R + 0.012, -0.02), V(FLANGE_R + 0.012, -0.11)];

/**
 * A solid of revolution with a wedge cut out of the side facing +z.
 * `wedge` is the full opening angle in radians; 0 leaves it whole.
 */
const Revolved: React.FC<{
  outline: THREE.Vector2[];
  wedge: number;
  material: THREE.Material;
  capMaterial?: THREE.Material;
  segments?: number;
  cast?: boolean;
}> = ({outline, wedge, material, capMaterial, segments = 96, cast = true}) => {
  const w = Math.round(wedge * 200) / 200;
  const body = useMemo(() => {
    const g = new THREE.LatheGeometry(bevel(outline), segments, w / 2, Math.PI * 2 - w);
    g.computeVertexNormals();
    return g;
  }, [outline, w, segments]);
  const cap = useMemo(() => {
    const s = new THREE.Shape(outline);
    return new THREE.ShapeGeometry(s);
  }, [outline]);
  return (
    <group>
      <mesh geometry={body} material={material} castShadow={cast} receiveShadow />
      {w > 0.01 && capMaterial ? (
        <>
          <mesh geometry={cap} material={capMaterial} rotation-y={w / 2 - Math.PI / 2} />
          <mesh geometry={cap} material={capMaterial} rotation-y={-w / 2 - Math.PI / 2} />
        </>
      ) : null}
    </group>
  );
};

// ---------------------------------------------------------------- the reactor top
const fromFront = (a: number) => Math.abs(((a + Math.PI) % (Math.PI * 2)) - Math.PI);

const Studs: React.FC<{wedge: number}> = ({wedge}) => {
  const m = mats();
  const open = wedge > 0.3;
  const ref = React.useRef<THREE.InstancedMesh>(null);
  const nuts = React.useRef<THREE.InstancedMesh>(null);
  React.useLayoutEffect(() => {
    const o = new THREE.Object3D();
    for (let i = 0; i < D.studCount; i++) {
      const a = ((i + 0.5) / D.studCount) * Math.PI * 2;
      o.position.set(Math.sin(a) * D.studCircleR, D.studH / 2, Math.cos(a) * D.studCircleR);
      o.rotation.set(0, a, 0);
      // in the cutaway, the studs on the near side come off so the opening can be seen
      o.scale.setScalar(open && fromFront(a) < 1.0 ? 0 : 1);
      o.updateMatrix();
      ref.current!.setMatrixAt(i, o.matrix);
      o.position.y = 0.035;
      o.updateMatrix();
      nuts.current!.setMatrixAt(i, o.matrix);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
    nuts.current!.instanceMatrix.needsUpdate = true;
  }, [open]);
  return (
    <>
      <instancedMesh ref={ref} args={[undefined, undefined, D.studCount]} material={m.stud} castShadow receiveShadow>
        <cylinderGeometry args={[D.studR, D.studR, D.studH, 20]} />
      </instancedMesh>
      <instancedMesh ref={nuts} args={[undefined, undefined, D.studCount]} material={m.flange} castShadow receiveShadow>
        <cylinderGeometry args={[D.studR * 1.75, D.studR * 1.75, 0.07, 6]} />
      </instancedMesh>
    </>
  );
};

/** The red "danger" tape a contractor wrapped round the studs: the only warning on the manway. */
const RedTape: React.FC<{wedge: number}> = ({wedge}) => {
  const m = mats();
  const r = D.studCircleR + D.studR + 0.004;
  const open = wedge > 0.3;
  const start = open ? 1.0 : 0;
  const len = Math.PI * 2 - start * 2;
  return (
    <group>
      <mesh material={m.redTape} position-y={0.36} rotation={open ? [0, 0, 0] : [0.03, 0, 0.02]}>
        <cylinderGeometry args={[r, r, 0.07, 64, 1, true, start, len]} />
      </mesh>
      <mesh material={m.redTape} position-y={0.445} rotation={open ? [0, 0, 0] : [-0.035, 0, -0.03]}>
        <cylinderGeometry args={[r, r, 0.07, 64, 1, true, start, len]} />
      </mesh>
    </group>
  );
};

const Tray: React.FC = () => {
  const m = mats();
  const caps = React.useRef<THREE.InstancedMesh>(null);
  const r = innerR(TRAY_Y) - 0.015;
  const spots = useMemo(() => {
    const out: [number, number][] = [];
    const s = 0.2;
    for (let j = -10; j <= 10; j++)
      for (let i = -10; i <= 10; i++) {
        const x = (i + (j % 2 ? 0.5 : 0)) * s;
        const z = j * s * 0.866;
        if (Math.hypot(x, z) > r - 0.1) continue;
        if (Math.hypot(x - TAPE[0], z - TAPE[2]) < 0.13) continue; // the tape lies between the caps
        out.push([x, z]);
      }
    return out;
  }, [r]);
  React.useLayoutEffect(() => {
    const o = new THREE.Object3D();
    spots.forEach(([x, z], i) => {
      o.position.set(x, TRAY_Y + 0.03, z);
      o.updateMatrix();
      caps.current!.setMatrixAt(i, o.matrix);
    });
    caps.current!.instanceMatrix.needsUpdate = true;
  }, [spots]);
  return (
    <group>
      <mesh material={m.tray} position-y={TRAY_Y - 0.02} receiveShadow>
        <cylinderGeometry args={[r, r, 0.04, 96]} />
      </mesh>
      <instancedMesh ref={caps} args={[undefined, undefined, spots.length]} material={m.cap} castShadow receiveShadow>
        <cylinderGeometry args={[0.058, 0.066, 0.06, 40]} />
      </instancedMesh>
      {/* packed catalyst below the tray */}
      <mesh material={m.bed} position-y={(TRAY_Y - 0.3 + Y_BOTTOM) / 2}>
        <cylinderGeometry args={[D.reactorR - 0.02, D.reactorR - 0.02, TRAY_Y - 0.3 - Y_BOTTOM, 64]} />
      </mesh>
    </group>
  );
};

const tapeFace = () =>
  tex((g, s) => {
    g.fillStyle = '#9ea4ad';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 46; i++) {
      const r = (0.29 + (i / 46) * 0.21) * s;
      g.strokeStyle = i % 2 ? 'rgba(60,64,72,0.55)' : 'rgba(225,230,238,0.5)';
      g.lineWidth = 1.2;
      g.beginPath();
      g.arc(s / 2, s / 2, r, 0, Math.PI * 2);
      g.stroke();
    }
  }, 256);
const tapeSide = () =>
  tex((g, s) => {
    const grad = g.createLinearGradient(0, 0, s, 0);
    for (let i = 0; i <= 12; i++) grad.addColorStop(i / 12, i % 2 ? '#b9bfc8' : '#8f959e');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(40,44,50,0.35)';
    for (let y = 0; y < s; y += 5) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(s, y);
      g.stroke();
    }
  }, 256);

export const TapeRoll: React.FC<{glow?: number}> = ({glow = 0}) => {
  const m = mats();
  const R = 0.064;
  const r = 0.037;
  const h = 0.05;
  const mat = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({color: '#b4bac4', map: tapeSide(), roughness: 0.34, metalness: 0.62, emissive: '#aeb6c4'});
    const face = new THREE.MeshStandardMaterial({color: '#b9bfc9', map: tapeFace(), roughness: 0.5, metalness: 0.45, emissive: '#aeb6c4'});
    return {side, face};
  }, []);
  mat.side.emissiveIntensity = 0.1 + glow * 0.55;
  mat.face.emissiveIntensity = 0.1 + glow * 0.55;
  const ring = useMemo(() => new THREE.RingGeometry(r, R, 48), []);
  return (
    <group position={[TAPE[0], TRAY_Y, TAPE[2]]} rotation={[0.0, 0.5, 0.0]}>
      <mesh material={mat.side} position-y={h / 2} castShadow receiveShadow>
        <cylinderGeometry args={[R, R, h, 48, 1, true]} />
      </mesh>
      <mesh geometry={ring} material={mat.face} position-y={h} rotation-x={-Math.PI / 2} receiveShadow />
      <mesh material={m.tapeCore} position-y={h / 2}>
        <cylinderGeometry args={[r, r, h, 32, 1, true]} />
      </mesh>
      {/* the loose end */}
      <group position={[R, h / 2, 0]} rotation={[0, -0.28, 0]}>
        <mesh material={mat.side} position={[0.002, 0, -0.034]} castShadow>
          <boxGeometry args={[0.0025, h, 0.068]} />
        </mesh>
      </group>
    </group>
  );
};

const Rails: React.FC<{wedge: number}> = ({wedge}) => {
  const m = mats();
  const posts: number[] = [];
  const n = 20;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const fromFront = Math.abs(((a + Math.PI) % (Math.PI * 2)) - Math.PI);
    if (fromFront > wedge / 2 + 0.04) posts.push(a);
  }
  const arc = Math.PI * 2 - wedge;
  const rr = PLAT_R - 0.05;
  // TorusGeometry sweeps from +x in the xy-plane; lay it flat and start it at the wedge edge.
  const rot: [number, number, number] = [Math.PI / 2, 0, wedge / 2 - Math.PI / 2];
  return (
    <group>
      {posts.map((a) => (
        <mesh key={a} material={m.rail} position={[Math.sin(a) * rr, 0.53, Math.cos(a) * rr]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 1.1, 10]} />
        </mesh>
      ))}
      {[1.07, 0.56].map((y) => (
        <mesh key={y} material={m.rail} position-y={y} rotation={rot} scale={[1, 1, 1]} castShadow>
          <torusGeometry args={[rr, 0.022, 8, 120, arc]} />
        </mesh>
      ))}
      <mesh material={m.rail} position-y={0.05} rotation={rot}>
        <torusGeometry args={[rr + 0.03, 0.012, 6, 120, arc]} />
      </mesh>
    </group>
  );
};

export const R1_LIGHTS: {p: [number, number, number]; c: string; s: number}[] = [
  {p: [-2.35, 2.75, -2.05], c: '#ffd9a6', s: 3.4},
  {p: [2.5, 2.75, -1.9], c: '#ffd9a6', s: 3.4},
  ...[-7, -14, -21].flatMap((y, k) =>
    [0.6, 2.2, 3.8, 5.4].map((a, j) => ({p: [Math.sin(a + k) * 3.2, y + 2.1, Math.cos(a + k) * 3.2] as [number, number, number], c: j % 2 ? '#ffb561' : '#ffd9a6', s: 2.6})),
  ),
];

/** Everything on the outside of R1 below the top platform: gives the climb up its side something to pass. */
const Dressing: React.FC = () => {
  const m = mats();
  const Ro = D.reactorR + WALL;
  const bands: number[] = [];
  for (let y = -3.2; y > Y_BOTTOM; y -= 2.9) bands.push(y);
  return (
    <group>
      {bands.map((y) => (
        <mesh key={y} material={m.flange} position-y={y} rotation-x={Math.PI / 2}>
          <torusGeometry args={[Ro + 0.01, 0.045, 8, 64]} />
        </mesh>
      ))}
      {[-7, -14, -21].map((y) => (
        <group key={y} position-y={y}>
          <mesh material={m.deck} receiveShadow>
            <cylinderGeometry args={[3.4, 3.4, 0.09, 48]} />
          </mesh>
          {[1.05, 0.55].map((h) => (
            <mesh key={h} material={m.rail} position-y={h} rotation-x={Math.PI / 2}>
              <torusGeometry args={[3.35, 0.022, 6, 72]} />
            </mesh>
          ))}
          {Array.from({length: 14}, (_, i) => (i / 14) * Math.PI * 2).map((a) => (
            <mesh key={a} material={m.rail} position={[Math.sin(a) * 3.35, 0.53, Math.cos(a) * 3.35]}>
              <cylinderGeometry args={[0.022, 0.022, 1.06, 8]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* riser pipe and caged ladder up the far side */}
      <mesh material={m.flange} position={[-(Ro + 0.3), (Y_BOTTOM - 0.6) / 2, -0.9]}>
        <cylinderGeometry args={[0.16, 0.16, -Y_BOTTOM - 0.6, 14]} />
      </mesh>
      {[-0.22, 0.22].map((dx) => (
        <mesh key={dx} material={m.rail} position={[1.2 + dx, (Y_BOTTOM - 0.2) / 2, -(Ro + 0.42)]}>
          <boxGeometry args={[0.05, -Y_BOTTOM - 0.2, 0.05]} />
        </mesh>
      ))}
      {Array.from({length: 30}, (_, i) => -0.9 - i * 0.9).map((y) => (
        <mesh key={y} material={m.rail} position={[1.2, y, -(Ro + 0.78)]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.38, 0.016, 5, 20, Math.PI]} />
        </mesh>
      ))}
      {/* work-light poles at the back of the top platform */}
      {[[-2.35, -2.05], [2.5, -1.9]].map(([x, z]) => (
        <group key={x} position={[x, 0, z]}>
          <mesh material={m.dark} position-y={1.35}>
            <cylinderGeometry args={[0.03, 0.03, 2.7, 8]} />
          </mesh>
          <mesh position-y={2.75}>
            <boxGeometry args={[0.34, 0.2, 0.12]} />
            <meshBasicMaterial color="#ffe9c4" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** R1's top: vessel head, manway, studs, platform, tray. `wedge` opens the cutaway. */
export const ReactorTop: React.FC<{wedge: number; tapeGlow?: number}> = ({wedge, tapeGlow}) => {
  const m = mats();
  const shell = useMemo(() => shellOutline(), []);
  const deck = useMemo(() => deckOutline(), []);
  const deckWedge = wedge > 0.01 ? Math.min(Math.PI * 1.2, wedge + 0.5) : 0;
  const beams = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (i / 8) * Math.PI * 2 + 0.39);
  return (
    <group>
      <Revolved outline={shell} wedge={wedge} material={m.shell} capMaterial={m.cut} />
      <Revolved outline={deck} wedge={deckWedge} material={m.deck} capMaterial={m.dark} segments={72} />
      <Rails wedge={deckWedge} />
      {beams.map((a) => {
        const fromFront = Math.abs(((a + Math.PI) % (Math.PI * 2)) - Math.PI);
        if (fromFront < deckWedge / 2 + 0.1) return null;
        return (
          <mesh key={a} material={m.dark} position={[Math.sin(a) * 2.45, -0.36, Math.cos(a) * 2.45]} rotation={[0, a, 0]} castShadow>
            <boxGeometry args={[0.12, 0.5, 1.4]} />
          </mesh>
        );
      })}
      <Dressing />
      <Studs wedge={wedge} />
      <RedTape wedge={wedge} />
      <Tray />
      <TapeRoll glow={tapeGlow} />
    </group>
  );
};

// ---------------------------------------------------------------- the refinery at night
const Lights: React.FC<{points: {p: [number, number, number]; c: string; s: number}[]}> = ({points}) => {
  const m = mats();
  const groups = useMemo(() => {
    const by: Record<string, {pos: number[]; col: number[]}> = {};
    const col = new THREE.Color();
    for (const l of points) {
      const k = String(l.s);
      by[k] ??= {pos: [], col: []};
      by[k].pos.push(...l.p);
      col.set(l.c);
      by[k].col.push(col.r, col.g, col.b);
    }
    return Object.entries(by).map(([size, v]) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(v.pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(v.col, 3));
      return {size: Number(size), g};
    });
  }, [points]);
  return (
    <>
      {groups.map(({size, g}) => (
        <points key={size} geometry={g} frustumCulled={false}>
          <pointsMaterial map={m.glow} size={size} sizeAttenuation vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} opacity={0.9} />
        </points>
      ))}
    </>
  );
};

const Sky: React.FC = () => {
  const t = useMemo(
    () =>
      tex((g, s) => {
        const grad = g.createLinearGradient(0, 0, 0, s);
        grad.addColorStop(0, '#02040a');
        grad.addColorStop(0.42, '#060b17');
        grad.addColorStop(0.5, '#16202f');
        grad.addColorStop(0.53, '#2a2a30');
        grad.addColorStop(0.6, '#0a0f18');
        grad.addColorStop(1, '#05070b');
        g.fillStyle = grad;
        g.fillRect(0, 0, s, s);
      }, 256),
    [],
  );
  const stars = useMemo(() => {
    const pos: number[] = [];
    for (let i = 0; i < 420; i++) {
      const a = rnd(i * 3.3) * Math.PI * 2;
      const e = 0.08 + rnd(i * 7.1) * 1.4;
      pos.push(Math.cos(a) * Math.cos(e) * 300, Math.sin(e) * 300, Math.sin(a) * Math.cos(e) * 300);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <>
      <mesh>
        <sphereGeometry args={[340, 32, 24]} />
        <meshBasicMaterial map={t} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
      <points geometry={stars}>
        <pointsMaterial color="#9fb4d8" size={1.3} sizeAttenuation={false} fog={false} transparent opacity={0.55} depthWrite={false} />
      </points>
    </>
  );
};

/** Everything that is not R1: neighbouring units, the adjacent reactor and crane, ground, sky. */
export const Refinery: React.FC = () => {
  const m = mats();
  const {columns, lights} = useMemo(() => {
    const columns: {x: number; z: number; r: number; top: number; rings: number[]}[] = [];
    const lights: {p: [number, number, number]; c: string; s: number}[] = [];
    const warm = ['#ffb561', '#ffc98a', '#ffa23d', '#ffe2b0'];
    for (let i = 0; i < 46; i++) {
      const a = rnd(i * 2.17) * Math.PI * 2;
      const front = Math.abs(((a + Math.PI * 1.5) % (Math.PI * 2)) - Math.PI) < 0.55; // keep the camera side open
      const dist = (front ? 46 : 15) + rnd(i * 5.3) * (front ? 50 : 70);
      const x = Math.cos(a) * dist;
      const z = Math.sin(a) * dist;
      const r = 0.7 + rnd(i * 9.9) * 2.0;
      const top = -16 + rnd(i * 4.7) * 30;
      const rings: number[] = [];
      for (let y = top - 1.5; y > Y_BOTTOM + 3; y -= 5 + rnd(i + y) * 4) rings.push(y);
      columns.push({x, z, r, top, rings});
      rings.forEach((y, k) => {
        const n = 2 + Math.floor(rnd(i * 3 + k) * 3);
        for (let j = 0; j < n; j++) {
          const b = rnd(i * 11 + k * 7 + j) * Math.PI * 2;
          lights.push({p: [x + Math.cos(b) * (r + 0.9), y + 1.6, z + Math.sin(b) * (r + 0.9)], c: warm[(i + j + k) % warm.length], s: 2.6});
        }
      });
      lights.push({p: [x, top + 1.2, z], c: '#ff3b2f', s: 2.2}); // aviation light
    }
    // ground-level sprawl
    for (let i = 0; i < 520; i++) {
      const a = rnd(i * 1.37 + 9) * Math.PI * 2;
      const dist = 12 + Math.pow(rnd(i * 6.1 + 2), 0.7) * 210;
      const c = rnd(i * 8.8) > 0.86 ? '#cfe3ff' : warm[i % warm.length];
      lights.push({p: [Math.cos(a) * dist, Y_BOTTOM + 1.5 + rnd(i * 3.9) * 7, Math.sin(a) * dist], c, s: rnd(i * 2.9) > 0.8 ? 4.2 : 2.4});
    }
    return {columns, lights};
  }, []);

  const twin = useMemo(() => {
    const g = new THREE.LatheGeometry(bevel(shellOutline()), 48);
    g.computeVertexNormals();
    return g;
  }, []);
  const TWIN: [number, number, number] = [-7.4, -0.6, -5.2];

  return (
    <group>
      <Sky />
      <mesh material={m.ground} position-y={Y_BOTTOM} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[320, 48]} />
      </mesh>
      {columns.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]}>
          <mesh material={m.shellFar} position-y={(c.top + Y_BOTTOM) / 2}>
            <cylinderGeometry args={[c.r, c.r, c.top - Y_BOTTOM, 20]} />
          </mesh>
          <mesh material={m.shellFar} position-y={c.top}>
            <sphereGeometry args={[c.r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          {c.rings.map((y) => (
            <mesh key={y} material={m.dark} position-y={y}>
              <cylinderGeometry args={[c.r + 1.1, c.r + 1.1, 0.12, 20]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* the adjacent reactor, where the catalyst crew and the crane were working */}
      <group position={TWIN}>
        <mesh geometry={twin} material={m.shellFar} />
        <mesh material={m.dark} position-y={-0.07}>
          <cylinderGeometry args={[PLAT_R, PLAT_R, 0.1, 40]} />
        </mesh>
        <mesh material={m.rail} position-y={1.05} rotation-x={Math.PI / 2}>
          <torusGeometry args={[PLAT_R - 0.05, 0.022, 6, 60]} />
        </mesh>
      </group>
      {/* crane boom over the adjacent reactor */}
      <group position={[-17, Y_BOTTOM, -14]} rotation={[0, 0.72, 0]}>
        <mesh material={m.dark} position={[0, 21, 6.5]} rotation={[0.31, 0, 0]}>
          <boxGeometry args={[0.7, 44, 0.7]} />
        </mesh>
      </group>
      <mesh material={m.dark} position={[-8.6, 9.5, -6.2]}>
        <cylinderGeometry args={[0.02, 0.02, 12, 6]} />
      </mesh>
      {/* pipe racks below */}
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} position={[-30 + i * 17, Y_BOTTOM + 6 + (i % 2) * 2, -24 - i * 9]} rotation-y={0.3 + i * 0.4}>
          <mesh material={m.dark}>
            <boxGeometry args={[46, 0.5, 3]} />
          </mesh>
          {[-1, 0, 1].map((k) => (
            <mesh key={k} material={m.shellFar} position={[0, 0.6, k * 0.9]} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.28, 0.28, 46, 10]} />
            </mesh>
          ))}
        </group>
      ))}
      <Lights points={[...lights, ...R1_LIGHTS, {p: [-8.6, 15.6, -6.2], c: '#ffe2b0', s: 5}, {p: [TWIN[0] + 2.4, 2.6, TWIN[2] + 1.2], c: '#ffd9a0', s: 5}]} />
    </group>
  );
};
