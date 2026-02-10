import { describe, it, expect, vi } from 'vitest';
import { FullscreenManager } from '../../modules/fullscreen';
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
    setCell: vi.fn(),
    getGridSnapshot: vi.fn(function (this: any) {
      return {
        grid: this.grid.map((r: boolean[]) => [...r]),
        generation: this.generation,
      };
    }),
  };
}

function setupDOM() {
  document.body.innerHTML = `
    <div class="game-container">
      <canvas id="gameCanvas" width="100" height="100"></canvas>
    </div>
    <button id="fullscreenBtn"><span class="btn-icon" data-lucide="maximize"></span></button>
    <button id="exitFullscreenBtn" style="display:none"></button>
    <div id="fullscreenFloatingControls" style="display:none">
      <button id="fullscreenPlayPauseBtn"><span class="btn-icon" data-lucide="play"></span></button>
    </div>
  `;
}

function setup(rows = 10, cols = 10, cellSize = 10) {
  setupDOM();
  const bus = new EventBus();
  const dom = new DomRegistry();
  const engine = createMockEngine(rows, cols);
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  // Set canvas dimensions
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;
  const manager = new FullscreenManager(bus, dom, engine as any, canvas, rows, cols, cellSize);
  return { bus, dom, engine, canvas, manager };
}

describe('FullscreenManager', () => {
  describe('enter', () => {
    it('sets fullscreen flag', () => {
      const { manager } = setup();
      manager.enter();
      expect(manager.isFullscreen).toBe(true);
    });

    it('adds fullscreen-active class to body', () => {
      const { manager } = setup();
      manager.enter();
      expect(document.body.classList.contains('fullscreen-active')).toBe(true);
    });

    it('adds fullscreen class to game container', () => {
      const { manager } = setup();
      manager.enter();
      expect(document.querySelector('.game-container')!.classList.contains('fullscreen')).toBe(true);
    });

    it('shows exit button', () => {
      const { manager } = setup();
      manager.enter();
      expect(document.getElementById('exitFullscreenBtn')!.style.display).toBe('block');
    });

    it('shows floating controls', () => {
      const { manager } = setup();
      manager.enter();
      expect(document.getElementById('fullscreenFloatingControls')!.style.display).toBe('flex');
    });

    it('emits ui:fullscreenEnter', () => {
      const { manager, bus } = setup();
      const handler = vi.fn();
      bus.on('ui:fullscreenEnter', handler);
      manager.enter();
      expect(handler).toHaveBeenCalled();
    });

    it('stores original canvas size', () => {
      const { manager, canvas } = setup(10, 10, 10);
      const origW = canvas.width;
      const origH = canvas.height;
      manager.enter();
      expect(manager.originalCanvasSize).toEqual({ width: origW, height: origH });
    });
  });

  describe('exit', () => {
    it('clears fullscreen flag', () => {
      const { manager } = setup();
      manager.enter();
      manager.exit();
      expect(manager.isFullscreen).toBe(false);
    });

    it('removes fullscreen classes', () => {
      const { manager } = setup();
      manager.enter();
      manager.exit();
      expect(document.body.classList.contains('fullscreen-active')).toBe(false);
      expect(document.querySelector('.game-container')!.classList.contains('fullscreen')).toBe(false);
    });

    it('hides exit button and floating controls', () => {
      const { manager } = setup();
      manager.enter();
      manager.exit();
      expect(document.getElementById('exitFullscreenBtn')!.style.display).toBe('none');
      expect(document.getElementById('fullscreenFloatingControls')!.style.display).toBe('none');
    });

    it('restores original canvas dimensions', () => {
      const { manager, canvas } = setup(10, 10, 10);
      const origW = canvas.width;
      const origH = canvas.height;
      manager.enter();
      manager.exit();
      expect(canvas.width).toBe(origW);
      expect(canvas.height).toBe(origH);
    });

    it('emits ui:fullscreenExit', () => {
      const { manager, bus } = setup();
      const handler = vi.fn();
      bus.on('ui:fullscreenExit', handler);
      manager.enter();
      manager.exit();
      expect(handler).toHaveBeenCalled();
    });

    it('calls onResize callback', () => {
      const { manager } = setup();
      const cb = vi.fn();
      manager.onResize = cb;
      manager.enter();
      manager.exit();
      expect(cb).toHaveBeenCalled();
    });
  });

  describe('handleFullscreenChange', () => {
    it('exits fullscreen when browser leaves fullscreen', () => {
      const { manager } = setup();
      manager.isFullscreen = true;
      // document.fullscreenElement is null (not fullscreen)
      manager.handleFullscreenChange();
      expect(manager.isFullscreen).toBe(false);
    });

    it('does nothing if not in fullscreen', () => {
      const { manager } = setup();
      manager.isFullscreen = false;
      manager.handleFullscreenChange();
      expect(manager.isFullscreen).toBe(false);
    });
  });

  describe('updatePlayPauseButton', () => {
    it('shows pause icon when running', () => {
      const { manager } = setup();
      manager.isRunning = true;
      manager.updatePlayPauseButton();
      const icon = document.querySelector('#fullscreenPlayPauseBtn .btn-icon')!;
      expect(icon.getAttribute('data-lucide')).toBe('pause');
    });

    it('shows play icon when stopped', () => {
      const { manager } = setup();
      manager.isRunning = false;
      manager.updatePlayPauseButton();
      const icon = document.querySelector('#fullscreenPlayPauseBtn .btn-icon')!;
      expect(icon.getAttribute('data-lucide')).toBe('play');
    });

    it('adds active class when running', () => {
      const { manager } = setup();
      manager.isRunning = true;
      manager.updatePlayPauseButton();
      expect(document.getElementById('fullscreenPlayPauseBtn')!.classList.contains('active')).toBe(true);
    });

    it('removes active class when stopped', () => {
      const { manager } = setup();
      manager.isRunning = true;
      manager.updatePlayPauseButton();
      manager.isRunning = false;
      manager.updatePlayPauseButton();
      expect(document.getElementById('fullscreenPlayPauseBtn')!.classList.contains('active')).toBe(false);
    });
  });
});
