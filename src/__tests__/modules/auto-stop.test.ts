import { describe, it, expect, vi } from 'vitest';
import { AutoStopManager } from '../../modules/auto-stop';
import { EventBus } from '../../core/event-bus';
import { DomRegistry } from '../../core/dom-registry';

function makeGrid(rows: number, cols: number, alive: [number, number][] = []): boolean[][] {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(false));
  for (const [r, c] of alive) grid[r][c] = true;
  return grid;
}

function setup(rows = 5, cols = 5) {
  document.body.innerHTML = `
    <input id="autoStopToggle" class="tool-btn" />
    <div id="autoStopSettings" style="display:none"></div>
  `;
  const bus = new EventBus();
  const dom = new DomRegistry();
  const grid = makeGrid(rows, cols);
  const engine = { grid };
  const manager = new AutoStopManager(bus, dom, engine);
  return { bus, dom, engine, manager };
}

describe('AutoStopManager', () => {
  describe('toggle', () => {
    it('toggles enabled state', () => {
      const { manager } = setup();
      expect(manager.enabled).toBe(false);
      manager.toggle();
      expect(manager.enabled).toBe(true);
      manager.toggle();
      expect(manager.enabled).toBe(false);
    });

    it('resets history when enabling', () => {
      const { manager } = setup();
      manager.generationHistory.push(makeGrid(5, 5));
      manager.stableGenerationCount = 3;
      manager.toggle(); // enable
      expect(manager.generationHistory).toHaveLength(0);
      expect(manager.stableGenerationCount).toBe(0);
    });

    it('emits settings:changed', () => {
      const { manager, bus } = setup();
      const handler = vi.fn();
      bus.on('settings:changed', handler);
      manager.toggle();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('updateUI', () => {
    it('shows settings panel when enabled', () => {
      const { manager } = setup();
      manager.enabled = true;
      manager.updateUI();
      expect(document.getElementById('autoStopSettings')!.style.display).toBe('block');
    });

    it('hides settings panel when disabled', () => {
      const { manager } = setup();
      manager.enabled = false;
      manager.updateUI();
      expect(document.getElementById('autoStopSettings')!.style.display).toBe('none');
    });
  });

  describe('captureCurrentGeneration', () => {
    it('creates a deep copy of the grid', () => {
      const { manager, engine } = setup(3, 3);
      engine.grid[1][1] = true;
      const snapshot = manager.captureCurrentGeneration();
      expect(snapshot[1][1]).toBe(true);
      // Modify original — snapshot should not change
      engine.grid[1][1] = false;
      expect(snapshot[1][1]).toBe(true);
    });
  });

  describe('compareGenerations', () => {
    it('returns true for identical grids', () => {
      const g1 = makeGrid(3, 3, [[0, 0], [1, 1]]);
      const g2 = makeGrid(3, 3, [[0, 0], [1, 1]]);
      expect(AutoStopManager.compareGenerations(g1, g2)).toBe(true);
    });

    it('returns false for different grids', () => {
      const g1 = makeGrid(3, 3, [[0, 0]]);
      const g2 = makeGrid(3, 3, [[1, 1]]);
      expect(AutoStopManager.compareGenerations(g1, g2)).toBe(false);
    });

    it('returns false for null inputs', () => {
      expect(AutoStopManager.compareGenerations(null, null)).toBe(false);
      expect(AutoStopManager.compareGenerations(makeGrid(2, 2), null)).toBe(false);
    });

    it('returns false for different dimensions', () => {
      expect(AutoStopManager.compareGenerations(makeGrid(2, 2), makeGrid(3, 3))).toBe(false);
    });
  });

  describe('check', () => {
    it('returns false when disabled', () => {
      const { manager } = setup();
      manager.enabled = false;
      expect(manager.check()).toBe(false);
    });

    it('accumulates history up to 10', () => {
      const { manager } = setup();
      manager.enabled = true;
      manager.delaySetting = 1;
      for (let i = 0; i < 12; i++) {
        manager.check();
      }
      expect(manager.generationHistory.length).toBeLessThanOrEqual(10);
    });

    it('detects stable state and triggers auto-stop', () => {
      const { manager, bus } = setup(3, 3);
      manager.enabled = true;
      manager.delaySetting = 1;
      const triggered = vi.fn();
      bus.on('autostop:triggered', triggered);

      // Feed the same grid repeatedly — delaySetting=1, so need delaySetting+2=3 gens
      // Then stableGenerationCount needs to reach 2
      for (let i = 0; i < 10; i++) {
        manager.check();
      }

      expect(triggered).toHaveBeenCalled();
    });

    it('resets stable count when grid changes', () => {
      const { manager, engine } = setup(3, 3);
      manager.enabled = true;
      manager.delaySetting = 1;

      // Feed same grid a few times
      manager.check();
      manager.check();
      manager.check();
      manager.check();

      // Change grid
      engine.grid[0][0] = !engine.grid[0][0];
      manager.check();

      expect(manager.stableGenerationCount).toBe(0);
    });
  });

  describe('trigger', () => {
    it('calls onStop callback', () => {
      const { manager } = setup(3, 3);
      manager.enabled = true;
      manager.delaySetting = 1;
      const stopFn = vi.fn();
      manager.onStop = stopFn;

      // Run enough checks to trigger
      for (let i = 0; i < 10; i++) {
        manager.check();
      }

      expect(stopFn).toHaveBeenCalled();
    });

    it('shows notification when enabled', () => {
      const { manager } = setup(3, 3);
      manager.enabled = true;
      manager.delaySetting = 1;
      manager.showNotification = true;

      for (let i = 0; i < 10; i++) {
        manager.check();
      }

      expect(document.querySelector('.autostop-notification')).not.toBeNull();
    });

    it('skips notification when disabled', () => {
      const { manager } = setup(3, 3);
      manager.enabled = true;
      manager.delaySetting = 1;
      manager.showNotification = false;

      for (let i = 0; i < 10; i++) {
        manager.check();
      }

      expect(document.querySelector('.autostop-notification')).toBeNull();
    });

    it('resets history after trigger', () => {
      const { manager } = setup(3, 3);
      manager.enabled = true;
      manager.delaySetting = 1;

      let triggered = false;
      for (let i = 0; i < 20; i++) {
        if (manager.check()) {
          triggered = true;
          break;
        }
      }

      expect(triggered).toBe(true);
      expect(manager.generationHistory).toHaveLength(0);
      expect(manager.stableGenerationCount).toBe(0);
    });
  });

  describe('getState / loadState', () => {
    it('round-trips state', () => {
      const { manager } = setup();
      manager.enabled = true;
      manager.delaySetting = 5;
      manager.showNotification = false;
      const state = manager.getState();

      const { manager: m2 } = setup();
      m2.loadState(state);
      expect(m2.enabled).toBe(true);
      expect(m2.delaySetting).toBe(5);
      expect(m2.showNotification).toBe(false);
    });
  });
});
