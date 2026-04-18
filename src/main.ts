import * as THREE from 'three';
import { initViewer } from './viewer/scene';
import { loadTshirt } from './viewer/tshirt';
import { createTextureBridge } from './viewer/texture-bridge';
import { createDesignCanvas } from './editor/canvas';
import { attachUploadHandlers } from './editor/upload';
import { attachToolbarHandlers } from './editor/tools';

const TEXTURE_SIZE = 2048;

async function main() {
  const statusEl = document.getElementById('viewer-status')!;
  const surfaceEl = document.getElementById('editor-surface')!;
  const viewerSurface = document.getElementById('viewer-surface')!;

  const designCanvas = createDesignCanvas('design-canvas', TEXTURE_SIZE);
  const bridge = createTextureBridge(designCanvas, TEXTURE_SIZE);

  designCanvas.on('after:render', () => bridge.requestUpdate());

  const updateEmptyState = () => {
    surfaceEl.classList.toggle('empty', designCanvas.getObjects().length === 0);
  };
  designCanvas.on('object:added', updateEmptyState);
  designCanvas.on('object:removed', updateEmptyState);
  updateEmptyState();

  const viewer = initViewer(viewerSurface);
  bridge.onUpdate = () => viewer.requestRender();

  attachUploadHandlers({
    canvas: designCanvas,
    surface: surfaceEl,
    fileInput: document.getElementById('file-input') as HTMLInputElement,
    uploadButton: document.getElementById('btn-upload') as HTMLButtonElement,
    textureSize: TEXTURE_SIZE,
  });

  attachToolbarHandlers({
    canvas: designCanvas,
    deleteBtn: document.getElementById('btn-delete') as HTMLButtonElement,
    forwardBtn: document.getElementById('btn-forward') as HTMLButtonElement,
    backwardBtn: document.getElementById('btn-backward') as HTMLButtonElement,
    resetBtn: document.getElementById('btn-reset') as HTMLButtonElement,
    colorInput: document.getElementById('color-input') as HTMLInputElement,
    onShirtColorChange: (color) => bridge.setShirtColor(color),
  });

  try {
    const tshirt = await loadTshirt(viewer.scene, {
      glbUrl: '/tshirt.glb',
      normalMapUrl: '/fabric_normal.png',
      colorMap: bridge.texture,
    });
    viewer.fit(tshirt.root);
    statusEl.textContent = 'Ready — drag to orbit, scroll to zoom';

    const guideTex = await new THREE.TextureLoader().loadAsync('/template-guide.png');
    guideTex.colorSpace = THREE.SRGBColorSpace;
    guideTex.flipY = false;
    guideTex.anisotropy = 8;

    let uvDebug = false;
    const uvBtn = document.getElementById('btn-uv-debug') as HTMLButtonElement;
    uvBtn.addEventListener('click', () => {
      uvDebug = !uvDebug;
      tshirt.setColorMap(uvDebug ? guideTex : bridge.texture);
      uvBtn.style.background = uvDebug ? '#4a9eff' : '';
      uvBtn.style.borderColor = uvDebug ? '#4a9eff' : '';
      viewer.requestRender();
    });
  } catch (err) {
    statusEl.textContent = 'Failed to load model (see console)';
    console.error('[tshirt] load error:', err);
  }
}

main().catch((err) => console.error(err));
