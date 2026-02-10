import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsPersistence } from '../../modules/settings-persistence';
import { EventBus } from '../../core/event-bus';
import { StorageService } from '../../core/storage-service';
import { DomRegistry } from '../../core/dom-registry';

function createMockEngine() {
  return {
    generation: 10,
    birthRules: [3],
    survivalRules: [2, 3],
    getGridSnapshot: vi.fn(() => ({ grid: [[true, false]], generation: 10 })),
    restoreFromSnapshot: vi.fn(),
    setCell: vi.fn(),
    setBirthRules: vi.fn(),
    setSurvivalRules: vi.fn(),
    getRulesAsString: vi.fn(() => 'B3/S23'),
    resize: vi.fn(),
  };
}

function createMockModule(state: any = {}) {
  return {
    getState: vi.fn(() => state),
    loadState: vi.fn(),
  };
}

function setupDOM() {
  document.body.innerHTML = `
    <canvas id="gameCanvas" width="100" height="100"></canvas>
    <input id="speedSlider" type="range" value="5" />
    <span id="speedValue">5</span>
    <input id="speedMax" type="text" value="60" />
    <input id="gridWidthMax" type="text" value="200" />
    <input id="gridHeightMax" type="text" value="200" />
    <input id="cellSizeMax" type="text" value="50" />
    <input id="randomDensityMax" type="text" value="100" />
    <input id="randomDensitySlider" type="range" value="50" />
    <span id="randomDensityValue">50%</span>
    <input id="randomSeedInput" value="" />
    <div class="sidebar"></div>
  `;
}

function setup() {
  setupDOM();
  localStorage.clear();
  const bus = new EventBus();
  const storage = new StorageService();
  const dom = new DomRegistry();
  const engine = createMockEngine();
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const modules = {
    gridSettings: createMockModule({ rows: 10, cols: 10, cellSize: 10 }),
    visualSettings: createMockModule({ showGrid: true }),
    autoStop: createMockModule({ enabled: false }),
    customRules: createMockModule({ ruleString: 'B3/S23' }),
    drawingTools: createMockModule({ mode: 'cell' }),
  };
  const sp = new SettingsPersistence(bus, storage, dom, modules, engine as any, canvas);
  return { bus, storage, dom, engine, canvas, modules, sp };
}

describe('SettingsPersistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('save', () => {
    it('gathers state from all modules', () => {
      const { sp, modules } = setup();
      sp.save();
      expect(modules.gridSettings.getState).toHaveBeenCalled();
      expect(modules.visualSettings.getState).toHaveBeenCalled();
      expect(modules.autoStop.getState).toHaveBeenCalled();
      expect(modules.customRules.getState).toHaveBeenCalled();
      expect(modules.drawingTools.getState).toHaveBeenCalled();
    });

    it('persists to localStorage', () => {
      const { sp } = setup();
      sp.save();
      const saved = localStorage.getItem('gameoflife-settings');
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed.timestamp).toBeDefined();
    });

    it('includes engine snapshot', () => {
      const { sp, engine } = setup();
      sp.save();
      expect(engine.getGridSnapshot).toHaveBeenCalled();
    });

    it('captures slider max values from DOM', () => {
      const { sp } = setup();
      sp.save();
      const saved = JSON.parse(localStorage.getItem('gameoflife-settings')!);
      expect(saved.sliderMaxes.speedMax).toBe('60');
    });

    it('captures speed from DOM', () => {
      const { sp } = setup();
      sp.save();
      const saved = JSON.parse(localStorage.getItem('gameoflife-settings')!);
      expect(saved.speed).toBe(5);
    });
  });

  describe('load', () => {
    it('distributes state to all modules', () => {
      const { sp, modules } = setup();
      sp.save();
      // Reset mocks
      Object.values(modules).forEach(m => m.loadState.mockClear());
      sp.load();
      expect(modules.gridSettings.loadState).toHaveBeenCalled();
      expect(modules.visualSettings.loadState).toHaveBeenCalled();
      expect(modules.autoStop.loadState).toHaveBeenCalled();
      expect(modules.customRules.loadState).toHaveBeenCalled();
      expect(modules.drawingTools.loadState).toHaveBeenCalled();
    });

    it('restores engine snapshot', () => {
      const { sp, engine } = setup();
      sp.save();
      engine.restoreFromSnapshot.mockClear();
      sp.load();
      expect(engine.restoreFromSnapshot).toHaveBeenCalled();
    });

    it('does nothing when no saved data', () => {
      const { sp, modules } = setup();
      sp.load();
      expect(modules.gridSettings.loadState).not.toHaveBeenCalled();
    });

    it('restores slider max values', () => {
      const { sp, dom } = setup();
      sp.save();
      // Change max values
      (document.getElementById('speedMax') as HTMLInputElement).value = '99';
      dom.invalidate();
      sp.load();
      expect((document.getElementById('speedMax') as HTMLInputElement).value).toBe('60');
    });

    it('restores speed slider', () => {
      const { sp } = setup();
      sp.save();
      (document.getElementById('speedSlider') as HTMLInputElement).value = '99';
      sp.load();
      expect((document.getElementById('speedSlider') as HTMLInputElement).value).toBe('5');
    });

    it('emits settings:loaded', () => {
      const { sp, bus } = setup();
      sp.save();
      const handler = vi.fn();
      bus.on('settings:loaded', handler);
      sp.load();
      expect(handler).toHaveBeenCalled();
    });

    it('calls onLoaded callback', () => {
      const { sp } = setup();
      sp.save();
      const cb = vi.fn();
      sp.onLoaded = cb;
      sp.load();
      expect(cb).toHaveBeenCalled();
    });

    it('resizes canvas and engine from grid settings', () => {
      const { sp, engine, canvas } = setup();
      sp.save();
      engine.resize.mockClear();
      sp.load();
      expect(engine.resize).toHaveBeenCalledWith(10, 10);
      expect(canvas.width).toBe(100);
      expect(canvas.height).toBe(100);
    });
  });

  describe('auto-save debounce', () => {
    it('saves after settings:changed event', async () => {
      const { sp, bus } = setup();
      const saveSpy = vi.spyOn(sp, 'save');
      bus.emit('settings:changed');

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 600));
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('handles missing/corrupt data gracefully', () => {
    it('handles corrupt JSON', () => {
      localStorage.setItem('gameoflife-settings', 'not json');
      const { sp, modules } = setup();
      sp.load(); // Should not throw
      expect(modules.gridSettings.loadState).not.toHaveBeenCalled();
    });

    it('handles expired data', () => {
      const expired = { timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000, speed: 5 };
      localStorage.setItem('gameoflife-settings', JSON.stringify(expired));
      const { sp, modules } = setup();
      sp.load();
      // StorageService filters by 30-day expiry, so getSettings returns null
      expect(modules.gridSettings.loadState).not.toHaveBeenCalled();
    });
  });
});
