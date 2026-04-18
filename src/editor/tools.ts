import { Canvas } from 'fabric';

interface Opts {
  canvas: Canvas;
  deleteBtn: HTMLButtonElement;
  forwardBtn: HTMLButtonElement;
  backwardBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  colorInput: HTMLInputElement;
  onShirtColorChange: (hex: string) => void;
}

export function attachToolbarHandlers(opts: Opts): void {
  const { canvas, deleteBtn, forwardBtn, backwardBtn, resetBtn, colorInput, onShirtColorChange } = opts;

  const deleteSelection = () => {
    const active = canvas.getActiveObjects();
    if (active.length === 0) return;
    active.forEach((o) => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  };

  deleteBtn.addEventListener('click', deleteSelection);

  forwardBtn.addEventListener('click', () => {
    const active = canvas.getActiveObject();
    if (active) {
      canvas.bringObjectForward(active);
      canvas.requestRenderAll();
    }
  });

  backwardBtn.addEventListener('click', () => {
    const active = canvas.getActiveObject();
    if (active) {
      canvas.sendObjectBackwards(active);
      canvas.requestRenderAll();
    }
  });

  resetBtn.addEventListener('click', () => {
    canvas.remove(...canvas.getObjects());
    canvas.requestRenderAll();
  });

  colorInput.addEventListener('input', () => {
    onShirtColorChange(colorInput.value);
  });
  onShirtColorChange(colorInput.value);

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (!canvas.getActiveObject()) return;
    e.preventDefault();
    deleteSelection();
  });
}
