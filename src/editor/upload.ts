import { Canvas, FabricImage } from 'fabric';

interface Opts {
  canvas: Canvas;
  surface: HTMLElement;
  fileInput: HTMLInputElement;
  uploadButton: HTMLButtonElement;
  textureSize: number;
}

export function attachUploadHandlers(opts: Opts): void {
  const { canvas, surface, fileInput, uploadButton, textureSize } = opts;

  uploadButton.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const files = fileInput.files ? Array.from(fileInput.files) : [];
    for (const file of files) await addImageFromFile(file);
    fileInput.value = '';
  });

  surface.addEventListener('dragover', (e) => {
    e.preventDefault();
    surface.classList.add('dragging');
  });
  surface.addEventListener('dragleave', (e) => {
    if (!surface.contains(e.relatedTarget as Node)) {
      surface.classList.remove('dragging');
    }
  });
  surface.addEventListener('drop', async (e) => {
    e.preventDefault();
    surface.classList.remove('dragging');
    const dt = e.dataTransfer;
    if (!dt) return;
    const files = Array.from(dt.files).filter((f) => f.type.startsWith('image/'));
    for (const file of files) await addImageFromFile(file);
  });

  async function addImageFromFile(file: File): Promise<void> {
    const url = await fileToDataURL(file);
    const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    const width = img.width ?? 1;
    const height = img.height ?? 1;
    const maxDim = textureSize * 0.35;
    const scale = Math.min(maxDim / width, maxDim / height, 1);
    img.scale(scale);
    img.set({
      left: textureSize / 2 - (img.getScaledWidth() / 2),
      top: textureSize / 2 - (img.getScaledHeight() / 2),
      cornerColor: '#ff2bd6',
      cornerStrokeColor: '#ffffff',
      cornerSize: 28,
      cornerStyle: 'circle',
      transparentCorners: false,
      borderColor: '#ff2bd6',
      borderScaleFactor: 3,
      padding: 6,
      rotatingPointOffset: 40,
    });
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
  }
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
