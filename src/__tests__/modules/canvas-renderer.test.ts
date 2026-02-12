import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CanvasRenderer } from '../../modules/canvas-renderer';
import { EventBus } from '../../core/event-bus';

// Mock 2D context with all methods used by the renderer
function createMockCtx() {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    setLineDash: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
  };
}

function createMockEngine(rows = 10, cols = 10) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(false));
  const maturity = Array.from({ length: rows }, () => Array(cols).fill(0));
  const fade = Array.from({ length: rows }, () => Array(cols).fill(0));
  return {
    getCell: (r: number, c: number) => grid[r]?.[c] ?? false,
    getCellMaturity: (r: number, c: number) => maturity[r]?.[c] ?? 0,
    getCellFadeLevel: (r: number, c: number) => fade[r]?.[c] ?? 0,
    grid,
    maturity,
    fade,
  };
}

function createCanvas(width = 100, height = 100) {
  const mockCtx = createMockCtx();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  // Override getContext to return our mock
  canvas.getContext = vi.fn().mockReturnValue(mockCtx) as any;
  return { canvas, mockCtx };
}

function createRenderer(rows = 10, cols = 10, cellSize = 10) {
  const { canvas, mockCtx } = createCanvas(cols * cellSize, rows * cellSize);
  const engine = createMockEngine(rows, cols);
  const bus = new EventBus();
  const renderer = new CanvasRenderer(canvas, engine as any, bus, rows, cols, cellSize);
  return { renderer, canvas, mockCtx, engine, bus };
}

describe('CanvasRenderer', () => {
  describe('static hexToRgb', () => {
    it('converts 6-digit hex to RGB', () => {
      expect(CanvasRenderer.hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('converts hex without # prefix', () => {
      expect(CanvasRenderer.hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('handles case-insensitive hex', () => {
      expect(CanvasRenderer.hexToRgb('#4C1D95')).toEqual({ r: 76, g: 29, b: 149 });
    });

    it('returns null for invalid hex', () => {
      expect(CanvasRenderer.hexToRgb('notahex')).toBeNull();
    });

    it('returns null for 3-digit shorthand hex', () => {
      expect(CanvasRenderer.hexToRgb('#fff')).toBeNull();
    });
  });

  describe('static hexToRgba', () => {
    it('converts hex to rgba with alpha', () => {
      expect(CanvasRenderer.hexToRgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('passes through rgb() values and adds alpha', () => {
      expect(CanvasRenderer.hexToRgba('rgb(100, 200, 50)', 0.8)).toBe(
        'rgba(100, 200, 50, 0.8)'
      );
    });

    it('returns fallback for unknown formats', () => {
      expect(CanvasRenderer.hexToRgba('hsl(0, 100%, 50%)', 0.5)).toBe(
        'rgba(66, 153, 225, 0.5)'
      );
    });
  });

  describe('getCellFromPixel', () => {
    let renderer: CanvasRenderer;

    beforeEach(() => {
      ({ renderer } = createRenderer());
    });

    it('returns correct cell for pixel in the middle of a cell', () => {
      expect(renderer.getCellFromPixel(15, 25)).toEqual({ row: 2, col: 1 });
    });

    it('returns row 0, col 0 for origin', () => {
      expect(renderer.getCellFromPixel(0, 0)).toEqual({ row: 0, col: 0 });
    });

    it('returns last cell for bottom-right pixel', () => {
      expect(renderer.getCellFromPixel(99, 99)).toEqual({ row: 9, col: 9 });
    });
  });

  describe('draw', () => {
    it('calls clearRect on canvas context', () => {
      const { renderer, mockCtx, canvas } = createRenderer();
      renderer.draw();
      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
    });

    it('responds to canvas:needsRedraw event', () => {
      const { renderer, bus } = createRenderer();
      const spy = vi.spyOn(renderer, 'draw');
      bus.emit('canvas:needsRedraw');
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe('resize', () => {
    it('updates dimensions and canvas size', () => {
      const { renderer, canvas } = createRenderer();
      renderer.resize(20, 30, 5);

      expect(renderer.rows).toBe(20);
      expect(renderer.cols).toBe(30);
      expect(renderer.cellSize).toBe(5);
      expect(canvas.width).toBe(150);
      expect(canvas.height).toBe(100);
    });
  });

  describe('visual flags', () => {
    it('sets and gets visual flags', () => {
      const { renderer } = createRenderer();
      renderer.setVisualFlags({ showGrid: true, cellShape: 'circle' });
      const flags = renderer.getVisualFlags();
      expect(flags.showGrid).toBe(true);
      expect(flags.cellShape).toBe('circle');
      expect(flags.showPixelGrid).toBe(false);
    });

    it('returns a copy (not a reference)', () => {
      const { renderer } = createRenderer();
      const flags1 = renderer.getVisualFlags();
      flags1.showGrid = true;
      const flags2 = renderer.getVisualFlags();
      expect(flags2.showGrid).toBe(false);
    });
  });

  describe('selection', () => {
    it('draws selection rectangle when active', () => {
      const { renderer, mockCtx } = createRenderer();
      renderer.setSelection({ startRow: 1, startCol: 2, endRow: 5, endCol: 8 }, true);
      renderer.draw();
      expect(mockCtx.strokeRect).toHaveBeenCalled();
      expect(mockCtx.setLineDash).toHaveBeenCalledWith([5, 5]);
    });

    it('does not draw selection when inactive', () => {
      const { renderer, mockCtx } = createRenderer();
      renderer.setSelection(null, false);
      renderer.draw();
      expect(mockCtx.setLineDash).not.toHaveBeenCalled();
    });
  });

  describe('pattern preview', () => {
    it('draws pattern preview cells', () => {
      const { renderer, mockCtx } = createRenderer();
      renderer.setPatternPreview({
        pattern: [[0, 1], [1, 1]],
        row: 5,
        col: 5,
      });
      renderer.draw();
      // Pattern has 3 live cells, so fillRect should be called for them
      // (plus potentially other calls from drawCells for engine cells)
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('does not draw when preview is null', () => {
      const { renderer, mockCtx } = createRenderer();
      renderer.setPatternPreview(null);
      renderer.draw();
      // fillRect should not be called (no live cells in engine either)
      expect(mockCtx.fillRect).not.toHaveBeenCalled();
    });
  });

  describe('fade/trail duration', () => {
    it('sets fadeDuration via setVisualFlags', () => {
      const { renderer } = createRenderer();
      renderer.setVisualFlags({ fadeDuration: 7 });
      const flags = renderer.getVisualFlags();
      expect(flags.fadeDuration).toBe(7);
    });

    it('includes fadeDuration in visual flags', () => {
      const { renderer } = createRenderer();
      const flags = renderer.getVisualFlags();
      expect(flags).toHaveProperty('fadeDuration');
      expect(typeof flags.fadeDuration).toBe('number');
    });

    it('does not draw fading cells when fadeMode is disabled', () => {
      const { renderer, mockCtx, engine } = createRenderer();

      // Set up a fading cell
      engine.grid[3][3] = false;
      engine.fade[3][3] = 4;

      renderer.setVisualFlags({ fadeMode: false, fadeDuration: 5 });
      renderer.draw();

      // With no live cells and fade mode off, nothing should be drawn
      expect(mockCtx.fillRect).not.toHaveBeenCalled();
    });

    it('preserves fadeDuration when updating other flags', () => {
      const { renderer } = createRenderer();

      renderer.setVisualFlags({ fadeDuration: 10 });
      renderer.setVisualFlags({ showGrid: true });

      const flags = renderer.getVisualFlags();
      expect(flags.fadeDuration).toBe(10);
      expect(flags.showGrid).toBe(true);
    });

    it('defaults fadeDuration to 1', () => {
      const { renderer } = createRenderer();
      const flags = renderer.getVisualFlags();
      expect(flags.fadeDuration).toBe(1);
    });
  });
});
