import { Canvas } from 'fabric';

export function createDesignCanvas(elementId: string, size: number): Canvas {
  const canvas = new Canvas(elementId, {
    backgroundColor: 'rgba(0,0,0,0)',
    preserveObjectStacking: true,
    selection: true,
    enableRetinaScaling: false,
  });
  canvas.setDimensions({ width: size, height: size });
  return canvas;
}
