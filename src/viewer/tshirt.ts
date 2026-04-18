import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

interface LoadOpts {
  glbUrl: string;
  normalMapUrl: string;
  colorMap: THREE.Texture;
}

export interface TshirtHandle {
  root: THREE.Object3D;
  setColorMap: (tex: THREE.Texture) => void;
}

export async function loadTshirt(scene: THREE.Scene, opts: LoadOpts): Promise<TshirtHandle> {
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(draco);

  const textureLoader = new THREE.TextureLoader();
  const normalMap = await textureLoader.loadAsync(opts.normalMapUrl);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(4, 4);
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.anisotropy = 8;

  const gltf = await gltfLoader.loadAsync(opts.glbUrl);
  const root = gltf.scene;

  const materials: THREE.MeshStandardMaterial[] = [];
  const meshNames: string[] = [];
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    meshNames.push(mesh.name || '(unnamed mesh)');
    const existing = mesh.material as THREE.MeshStandardMaterial | undefined;
    const material = new THREE.MeshStandardMaterial({
      map: opts.colorMap,
      normalMap,
      roughness: existing?.roughness ?? 0.85,
      metalness: 0,
      color: 0xffffff,
    });
    material.normalScale.set(0.6, 0.6);
    mesh.material = material;
    materials.push(material);
  });
  console.info('[tshirt] meshes:', meshNames);

  scene.add(root);

  const box = new THREE.Box3().setFromObject(root);
  console.info('[tshirt] bbox size:', box.getSize(new THREE.Vector3()).toArray());

  return {
    root,
    setColorMap(tex: THREE.Texture) {
      for (const m of materials) {
        m.map = tex;
        m.needsUpdate = true;
      }
    },
  };
}
