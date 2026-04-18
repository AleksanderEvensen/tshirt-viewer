import * as THREE from 'three';
import type { Canvas as FabricCanvas } from 'fabric';

export interface TextureBridge {
  texture: THREE.CanvasTexture;
  requestUpdate: () => void;
  setShirtColor: (hex: string) => void;
  onUpdate: () => void;
}

export function createTextureBridge(fabricCanvas: FabricCanvas, size: number): TextureBridge {
  const outCanvas = document.createElement('canvas');
  outCanvas.width = size;
  outCanvas.height = size;
  const ctx = outCanvas.getContext('2d', { willReadFrequently: false })!;

  const scratch = document.createElement('canvas');
  scratch.width = size;
  scratch.height = size;
  const scratchCtx = scratch.getContext('2d')!;

  let shirtColor = '#ffffff';
  let dirty = true;

  function composite() {
    const active = fabricCanvas.getActiveObjects();
    const restore: Array<() => void> = [];
    for (const obj of active) {
      const hc = obj.hasControls;
      const hb = obj.hasBorders;
      obj.hasControls = false;
      obj.hasBorders = false;
      restore.push(() => {
        obj.hasControls = hc;
        obj.hasBorders = hb;
      });
    }

    scratchCtx.clearRect(0, 0, size, size);
    fabricCanvas.renderCanvas(scratchCtx, fabricCanvas.getObjects());

    for (const r of restore) r();

    ctx.fillStyle = shirtColor;
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(scratch, 0, 0, size, size);
  }

  composite();

  const texture = new THREE.CanvasTexture(outCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.anisotropy = 8;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  const bridge: TextureBridge = {
    texture,
    requestUpdate: () => {
      dirty = true;
    },
    setShirtColor(hex: string) {
      shirtColor = hex;
      dirty = true;
    },
    onUpdate: () => {},
  };

  function tick() {
    if (dirty) {
      composite();
      texture.needsUpdate = true;
      dirty = false;
      bridge.onUpdate();
    }
    requestAnimationFrame(tick);
  }
  tick();

  return bridge;
}
