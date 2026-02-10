import { describe, it, expect, vi } from 'vitest';
import { GridSettingsManager } from '../../modules/grid-settings';
import { EventBus } from '../../core/event-bus';
import { DomRegistry } from '../../core/dom-registry';

function createMockEngine(rows = 10, cols = 10) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(false));
  return {
    grid,
    generation: 0,
    resize: vi.fn(function (this: any, r: number, c: number) {
      this.grid = Array.from({ length: r }, () => Array(c).fill(false));
    }),
    setCell: vi.fn(function (this: any, r: number, c: number, alive: boolean) {
      if (this.grid[r]) this.grid[r][c] = alive;
    }),
    getGridSnapshot: vi.fn(function (this: any) {
      return {
        grid: this.grid.map((row: boolean[]) => [...row]),
        generation: this.generation,
      };
    }),
  };
}

function setupDOM(width = 10, height = 10, cellSize = 10) {
  document.body.innerHTML = `
    <canvas id="gameCanvas" width="${width * cellSize}" height="${height * cellSize}"></canvas>
    <input id="gridWidthSlider" type="range" min="5" max="200" value="${width}" />
    <input id="gridHeightSlider" type="range" min="5" max="200" value="${height}" />
    <input id="cellSizeSlider" type="range" min="2" max="50" value="${cellSize}" />
  `;
}

function setup(rows = 10, cols = 10, cellSize = 10) {
  setupDOM(cols, rows, cellSize);
  const bus = new EventBus();
  const dom = new DomRegistry();
  const engine = createMockEngine(rows, cols);
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const manager = new GridSettingsManager(bus, dom, engine as any, canvas, rows, cols, cellSize);
  return { bus, dom, engine, canvas, manager };
}

describe('GridSettingsManager', () => {
  describe('apply', () => {
    it('returns false when simulation is running', () => {
      const { manager } = setup();
      expect(manager.apply(true)).toBe(false);
    });

    it('resizes engine to slider values', () => {
      const { manager, engine } = setup();
      (document.getElementById('gridWidthSlider') as HTMLInputElement).value = '20';
      (document.getElementById('gridHeightSlider') as HTMLInputElement).value = '15';
      (document.getElementById('cellSizeSlider') as HTMLInputElement).value = '8';

      manager.apply(false);

      expect(engine.resize).toHaveBeenCalledWith(15, 20);
      expect(manager.rows).toBe(15);
      expect(manager.cols).toBe(20);
      expect(manager.cellSize).toBe(8);
    });

    it('updates canvas dimensions', () => {
      const { manager, canvas } = setup();
      (document.getElementById('gridWidthSlider') as HTMLInputElement).value = '20';
      (document.getElementById('gridHeightSlider') as HTMLInputElement).value = '15';
      (document.getElementById('cellSizeSlider') as HTMLInputElement).value = '8';

      manager.apply(false);

      expect(canvas.width).toBe(160); // 20 * 8
      expect(canvas.height).toBe(120); // 15 * 8
    });

    it('emits grid:resized event', () => {
      const { manager, bus } = setup();
      const handler = vi.fn();
      bus.on('grid:resized', handler);
      manager.apply(false);
      expect(handler).toHaveBeenCalledWith({ rows: 10, cols: 10, cellSize: 10 });
    });

    it('emits settings:changed event', () => {
      const { manager, bus } = setup();
      const handler = vi.fn();
      bus.on('settings:changed', handler);
      manager.apply(false);
      expect(handler).toHaveBeenCalled();
    });

    it('calls onResize callback', () => {
      const { manager } = setup();
      const cb = vi.fn();
      manager.onResize = cb;
      manager.apply(false);
      expect(cb).toHaveBeenCalledWith(10, 10, 10);
    });
  });

  describe('liveResize', () => {
    it('returns false when in fullscreen', () => {
      const { manager } = setup();
      expect(manager.liveResize(true)).toBe(false);
    });

    it('returns false when nothing changed', () => {
      const { manager } = setup();
      expect(manager.liveResize(false)).toBe(false);
    });

    it('resizes and preserves existing cells', () => {
      const { manager, engine } = setup(5, 5, 10);
      engine.grid[0][0] = true;
      engine.grid[1][1] = true;

      // Resize to larger grid
      (document.getElementById('gridWidthSlider') as HTMLInputElement).value = '8';
      (document.getElementById('gridHeightSlider') as HTMLInputElement).value = '8';

      manager.liveResize(false);

      // Engine.resize was called, then setCell should restore
      expect(engine.resize).toHaveBeenCalledWith(8, 8);
      expect(engine.setCell).toHaveBeenCalled();
    });

    it('emits grid:resized', () => {
      const { manager, bus } = setup();
      const handler = vi.fn();
      bus.on('grid:resized', handler);

      (document.getElementById('gridWidthSlider') as HTMLInputElement).value = '20';
      manager.liveResize(false);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('restoreGridContent', () => {
    it('does nothing for null snapshot', () => {
      const { manager, engine } = setup();
      manager.restoreGridContent(null, 10, 10);
      expect(engine.setCell).not.toHaveBeenCalled();
    });

    it('restores cells up to min dimensions', () => {
      const { manager, engine } = setup(5, 5);
      const oldGrid = Array.from({ length: 8 }, () => Array(8).fill(false));
      oldGrid[0][0] = true;
      oldGrid[7][7] = true; // Beyond new 5x5 bounds

      manager.restoreGridContent({ grid: oldGrid, generation: 42 }, 5, 5);

      expect(engine.setCell).toHaveBeenCalledWith(0, 0, true);
      // Row 7, Col 7 should not be restored (beyond bounds)
      const calls = (engine.setCell as any).mock.calls;
      const outOfBoundsCall = calls.find((c: any) => c[0] === 7 && c[1] === 7);
      expect(outOfBoundsCall).toBeUndefined();
    });

    it('restores generation number', () => {
      const { manager, engine } = setup();
      manager.restoreGridContent({ grid: [[false]], generation: 99 }, 10, 10);
      expect(engine.generation).toBe(99);
    });
  });

  describe('updateSliderMax', () => {
    it('updates max when new max >= current value', () => {
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '1';
      slider.max = '100';
      slider.value = '50';

      GridSettingsManager.updateSliderMax(slider, '200');
      expect(slider.max).toBe('200');
      expect(slider.value).toBe('50');
    });

    it('clamps value when new max < current value', () => {
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '1';
      slider.max = '100';
      slider.value = '80';

      GridSettingsManager.updateSliderMax(slider, '30');
      expect(slider.max).toBe('30');
      expect(slider.value).toBe('30');
    });
  });

  describe('getState / loadState', () => {
    it('round-trips grid state', () => {
      const { manager } = setup(15, 20, 8);
      const state = manager.getState();
      expect(state).toEqual({ rows: 15, cols: 20, cellSize: 8 });

      const { manager: m2 } = setup();
      m2.loadState(state);
      expect(m2.rows).toBe(15);
      expect(m2.cols).toBe(20);
      expect(m2.cellSize).toBe(8);
    });
  });
});
