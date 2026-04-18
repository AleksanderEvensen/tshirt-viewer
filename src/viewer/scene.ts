import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface Viewer {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  requestRender: () => void;
  fit: (object: THREE.Object3D, padding?: number) => void;
}

export function initViewer(container: HTMLElement): Viewer {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1f);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 100);
  camera.position.set(0, 1.4, 2.8);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new RoomEnvironment();
  scene.environment = pmrem.fromScene(envScene, 0.04).texture;
  envScene.clear();

  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(2, 3.5, 2);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xcfd8ff, 0.3);
  fill.position.set(-2, 1, -1);
  scene.add(fill);

  scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1.0, 0);
  controls.minDistance = 0.1;
  controls.maxDistance = 100;

  let pendingRender = true;
  const requestRender = () => {
    pendingRender = true;
  };
  controls.addEventListener('change', requestRender);

  const resizeObserver = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pendingRender = true;
  });
  resizeObserver.observe(container);

  function tick() {
    const moved = controls.update();
    if (moved || pendingRender) {
      renderer.render(scene, camera);
      pendingRender = false;
    }
    requestAnimationFrame(tick);
  }
  tick();

  function fit(object: THREE.Object3D, padding = 1.4) {
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const distance = (maxDim / 2) / Math.tan(fov / 2) * padding;

    camera.position.set(center.x, center.y, center.z + distance);
    camera.near = Math.max(0.01, distance / 100);
    camera.far = distance * 100;
    camera.updateProjectionMatrix();

    controls.target.copy(center);
    controls.minDistance = distance * 0.2;
    controls.maxDistance = distance * 5;
    controls.update();
    pendingRender = true;
  }

  return { scene, camera, renderer, requestRender, fit };
}
