// WebGL render of the PXL Clock based on IKEA SANNAHED 25x25.
// Outer 27×27×6 cm, inner opening 25×25 cm, bezel 1 cm. Scene units = cm.
//
// The display is just the existing 2D photoreal canvas projected as a texture
// onto a plane inside the cavity — no per-LED 3D geometry, no instancing.
// All the pretty LED rendering already happens in pixel-canvas.ts; we reuse it.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const FRAME_OUTER = 27;
const FRAME_INNER = 25;
const FRAME_DEPTH = 6;

export interface Clock3DConfig {
  /** Camera x position (cm). Positive = right-of-clock view. */
  camX: number;
  /** Camera y position (cm). Positive = above-clock view. */
  camY: number;
  /** Camera z position (cm). How far the camera sits in front of the clock. */
  camZ: number;
  /** Camera vertical field of view (degrees). */
  fov: number;
  /** How far the LED surface sits recessed behind the bezel (cm). */
  recess: number;
}

export const DEFAULT_3D_CONFIG: Clock3DConfig = {
  camX: 22,
  camY: 7,
  camZ: 102,
  fov: 18,
  recess: 0.7,
};

export interface Clock3DHandle {
  /** Call after the source canvas has been redrawn so the texture refreshes. */
  markDirty(): void;
  setRunning(on: boolean): void;
  setConfig(partial: Partial<Clock3DConfig>): void;
  getConfig(): Clock3DConfig;
  destroy(): void;
}

export function mountClock3D(
  container: HTMLElement,
  sourceCanvas: HTMLCanvasElement,
  initialConfig?: Partial<Clock3DConfig>,
): Clock3DHandle {
  const cfg: Clock3DConfig = { ...DEFAULT_3D_CONFIG, ...initialConfig };
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Tone mapping compresses highlights so the LED bloom doesn't nuke the
  // scene into pure white. ACES Filmic gives a natural-looking rolloff.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  // Environment map: a procedurally-generated soft studio room. PBR materials
  // pick this up as ambient reflections, which is what makes the matte black
  // frame look like an actual object in a room instead of a flat silhouette.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.7;

  // Camera positioned from the runtime config. Defaults give a slight 3/4
  // view similar to the SANNAHED reference photo, but every value is
  // adjustable via setConfig() so the tweak panel can dial it in live.
  const camera = new THREE.PerspectiveCamera(cfg.fov, 1, 0.1, 1000);
  camera.position.set(cfg.camX, cfg.camY, cfg.camZ);
  camera.lookAt(0, 0, 0);

  // Direct lights ON TOP of the environment map. The env map handles the
  // "what's in the room" feel; these add directional shaping so the right
  // edge catches a brighter rim and the front bezel reads clearly.
  const key = new THREE.DirectionalLight(0xfff6ec, 0.7);
  key.position.set(20, 25, 35);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.5);
  rim.position.set(50, 8, 0);  // grazes the right depth edge
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.25);
  fill.position.set(-25, 5, 20);
  scene.add(fill);

  // Frame body — hollow square donut, extruded along Z. Outer 27×27 with a
  // 25×25 hole; depth 6cm. This is the SANNAHED's actual geometry.
  //
  // Two-material setup: caps (front + back bezel face) slightly different
  // shade from the extruded sides. With the rim light grazing across the
  // side wall, the front/side colour break makes the frame geometry read
  // instead of being one uniform black silhouette.
  //
  // Small bevel adds a chamfer to the outer + inner edges — real frames
  // aren't knife-sharp, and the chamfer catches a thin highlight that
  // really sells the depth.
  // SANNAHED is matte hardboard with paper-film veneer — quite rough, no
  // sheen. Slightly different tones between caps (front + back face) and
  // the extruded sides so the geometry reads even at low light angles.
  const capsMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2d,
    roughness: 0.78,
    metalness: 0.0,
  });
  const sidesMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c1f,
    roughness: 0.82,
    metalness: 0.0,
  });
  const outerShape = new THREE.Shape();
  outerShape.moveTo(-FRAME_OUTER / 2, -FRAME_OUTER / 2);
  outerShape.lineTo( FRAME_OUTER / 2, -FRAME_OUTER / 2);
  outerShape.lineTo( FRAME_OUTER / 2,  FRAME_OUTER / 2);
  outerShape.lineTo(-FRAME_OUTER / 2,  FRAME_OUTER / 2);
  outerShape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-FRAME_INNER / 2, -FRAME_INNER / 2);
  hole.lineTo( FRAME_INNER / 2, -FRAME_INNER / 2);
  hole.lineTo( FRAME_INNER / 2,  FRAME_INNER / 2);
  hole.lineTo(-FRAME_INNER / 2,  FRAME_INNER / 2);
  hole.closePath();
  outerShape.holes.push(hole);
  const frameGeo = new THREE.ExtrudeGeometry(outerShape, {
    depth: FRAME_DEPTH - 0.2,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelOffset: 0,
    bevelSegments: 2,
  });
  frameGeo.translate(0, 0, -(FRAME_DEPTH - 0.2) / 2);
  const frame = new THREE.Mesh(frameGeo, [capsMat, sidesMat]);
  scene.add(frame);

  // Display surface — a single textured plane sitting inside the cavity,
  // recessed slightly behind the front bezel face. The texture IS the live
  // 2D canvas that pixel-canvas.ts is already drawing into.
  const tex = new THREE.CanvasTexture(sourceCanvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  const displayMat = new THREE.MeshBasicMaterial({ map: tex });
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(FRAME_INNER, FRAME_INNER),
    displayMat,
  );
  display.position.z = FRAME_DEPTH / 2 - cfg.recess;
  scene.add(display);

  // Bloom pipeline — runs the scene through UnrealBloomPass so bright LEDs
  // bleed a tiny halo onto the frame's inner edge (real LEDs do this). The
  // texture already has per-pixel bloom baked in via renderRgbPhotoreal,
  // so this pass is intentionally gentle — only the brightest pixels above
  // threshold spill outward, and even then with very low strength.
  //
  // The composer's render target uses 4× MSAA + HalfFloat so antialiasing
  // works (EffectComposer ignores the renderer's `antialias: true` flag)
  // and HDR values survive the bloom blur without quantising.
  const composerTarget = new THREE.WebGLRenderTarget(1, 1, {
    samples: 4,
    type: THREE.HalfFloatType,
  });
  const composer = new EffectComposer(renderer, composerTarget);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(512, 512),
    0.18,   // strength — very subtle spill on top of the texture's own bloom
    0.35,   // radius
    0.82,   // threshold — only near-white pixels (peak LEDs) bloom outward
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  // Static-ish render: we only re-render when the texture is marked dirty or
  // the container resizes. No always-on RAF loop.
  let running = true;
  let queued = false;
  function scheduleRender() {
    if (queued || !running) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      composer.render();
    });
  }
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    scheduleRender();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  function markDirty() {
    tex.needsUpdate = true;
    scheduleRender();
  }
  function setRunning(on: boolean) {
    running = on;
    if (on) scheduleRender();
  }
  function setConfig(partial: Partial<Clock3DConfig>) {
    Object.assign(cfg, partial);
    camera.position.set(cfg.camX, cfg.camY, cfg.camZ);
    camera.lookAt(0, 0, 0);
    camera.fov = cfg.fov;
    camera.updateProjectionMatrix();
    display.position.z = FRAME_DEPTH / 2 - cfg.recess;
    scheduleRender();
  }
  function getConfig(): Clock3DConfig {
    return { ...cfg };
  }
  function destroy() {
    running = false;
    ro.disconnect();
    tex.dispose();
    displayMat.dispose();
    display.geometry.dispose();
    frameGeo.dispose();
    capsMat.dispose();
    sidesMat.dispose();
    bloomPass.dispose();
    composer.dispose();
    composerTarget.dispose();
    envRT.dispose();
    pmrem.dispose();
    renderer.dispose();
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
  }

  return { markDirty, setRunning, setConfig, getConfig, destroy };
}
