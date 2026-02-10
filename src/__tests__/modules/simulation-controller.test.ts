import { describe, it, expect, vi, afterEach } from 'vitest';
import { SimulationController, SimEngine } from '../../modules/simulation-controller';
import { EventBus } from '../../core/event-bus';
import { DomRegistry } from '../../core/dom-registry';

function createMockEngine(): SimEngine {
  const grid = Array.from({ length: 10 }, () => Array(10).fill(false));
  return {
    generation: 0,
    grid,
    getPopulation: vi.fn(() => 0),
    getGridSnapshot: vi.fn(() => ({ grid: grid.map(r => [...r]), generation: 0 })),
    restoreFromSnapshot: vi.fn(),
    updateGeneration: vi.fn(() => { (mockEngine as any).generation++; }),
    updateFadeGrid: vi.fn(),
    clear: vi.fn(),
    randomize: vi.fn(),
    placePattern: vi.fn(),
    fillEdges: vi.fn(),
    fillCenter: vi.fn(),
    invert: vi.fn(),
  };
  // Note: we use a variable so updateGeneration can reference it
}

// Create engine separately so updateGeneration can reference it
let mockEngine: SimEngine;

function setupDOM() {
  document.body.innerHTML = `
    <canvas id="gameCanvas" width="100" height="100"></canvas>
    <button id="startStopBtn"><span class="btn-icon" data-lucide="play"></span></button>
    <span id="generationDisplay">0</span>
    <span id="populationDisplay">0</span>
    <input id="randomSeedInput" value="" />
  `;
}

function setup() {
  setupDOM();
  const bus = new EventBus();
  const dom = new DomRegistry();
  mockEngine = createMockEngine();
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const sim = new SimulationController({ bus, dom, engine: mockEngine, canvas }, 10, 10);
  return { bus, dom, engine: mockEngine, canvas, sim };
}

describe('SimulationController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('toggleSimulation', () => {
    it('starts simulation', () => {
      const { sim, bus } = setup();
      const handler = vi.fn();
      bus.on('simulation:start', handler);
      sim.toggleSimulation();
      expect(sim.isRunning).toBe(true);
      expect(handler).toHaveBeenCalled();
      // Cleanup
      sim.isRunning = false;
      if (sim.animationId) cancelAnimationFrame(sim.animationId);
    });

    it('stops simulation', () => {
      const { sim, bus } = setup();
      const handler = vi.fn();
      bus.on('simulation:stop', handler);
      sim.isRunning = true;
      sim.toggleSimulation();
      expect(sim.isRunning).toBe(false);
      expect(handler).toHaveBeenCalled();
    });

    it('captures initial state on start', () => {
      const { sim, engine } = setup();
      sim.toggleSimulation();
      expect(engine.getGridSnapshot).toHaveBeenCalled();
      expect(sim.initialState).not.toBeNull();
      sim.isRunning = false;
      if (sim.animationId) cancelAnimationFrame(sim.animationId);
    });
  });

  describe('update', () => {
    it('calls engine.updateGeneration', () => {
      const { sim, engine } = setup();
      sim.onDraw = vi.fn();
      sim.update();
      expect(engine.updateGeneration).toHaveBeenCalled();
    });

    it('emits simulation:tick', () => {
      const { sim, bus } = setup();
      sim.onDraw = vi.fn();
      const handler = vi.fn();
      bus.on('simulation:tick', handler);
      sim.update();
      expect(handler).toHaveBeenCalled();
    });

    it('calls onRecordingUpdate hook', () => {
      const { sim } = setup();
      sim.onDraw = vi.fn();
      const hook = vi.fn();
      sim.onRecordingUpdate = hook;
      sim.update();
      expect(hook).toHaveBeenCalled();
    });

    it('calls onSessionCapture hook', () => {
      const { sim } = setup();
      sim.onDraw = vi.fn();
      const hook = vi.fn();
      sim.onSessionCapture = hook;
      sim.update();
      expect(hook).toHaveBeenCalled();
    });

    it('updates fade grid when fadeMode on', () => {
      const { sim, engine } = setup();
      sim.onDraw = vi.fn();
      sim.fadeMode = true;
      sim.fadeDuration = 7;
      sim.update();
      expect(engine.updateFadeGrid).toHaveBeenCalledWith(7);
    });
  });

  describe('reset', () => {
    it('stops running', () => {
      const { sim } = setup();
      sim.isRunning = true;
      sim.onDraw = vi.fn();
      sim.reset();
      expect(sim.isRunning).toBe(false);
    });

    it('restores initial state if available', () => {
      const { sim, engine } = setup();
      sim.onDraw = vi.fn();
      sim.initialState = { grid: [[true]], generation: 5 };
      sim.reset();
      expect(engine.restoreFromSnapshot).toHaveBeenCalled();
    });

    it('clears engine if no initial state', () => {
      const { sim, engine } = setup();
      sim.onDraw = vi.fn();
      sim.initialState = null;
      sim.reset();
      expect(engine.clear).toHaveBeenCalled();
    });

    it('emits simulation:reset', () => {
      const { sim, bus } = setup();
      sim.onDraw = vi.fn();
      const handler = vi.fn();
      bus.on('simulation:reset', handler);
      sim.reset();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('randomize', () => {
    it('does nothing when running', () => {
      const { sim, engine } = setup();
      sim.isRunning = true;
      sim.randomize();
      expect(engine.randomize).not.toHaveBeenCalled();
    });

    it('calls engine.randomize with correct density', () => {
      const { sim, engine } = setup();
      sim.onDraw = vi.fn();
      sim.randomDensity = 75;
      sim.randomize();
      expect(engine.randomize).toHaveBeenCalledWith(0.75, null);
    });

    it('clears initial state', () => {
      const { sim } = setup();
      sim.onDraw = vi.fn();
      sim.initialState = { grid: [[true]] };
      sim.randomize();
      expect(sim.initialState).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('does nothing when running', () => {
      const { sim, engine } = setup();
      sim.isRunning = true;
      sim.clearAll();
      expect(engine.clear).not.toHaveBeenCalled();
    });

    it('clears engine and initial state', () => {
      const { sim, engine } = setup();
      sim.onDraw = vi.fn();
      sim.initialState = { grid: [[true]] };
      sim.clearAll();
      expect(engine.clear).toHaveBeenCalled();
      expect(sim.initialState).toBeNull();
    });

    it('emits grid:cleared', () => {
      const { sim, bus } = setup();
      sim.onDraw = vi.fn();
      const handler = vi.fn();
      bus.on('grid:cleared', handler);
      sim.clearAll();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('fillEdges / fillCenter / invertAll', () => {
    it('fillEdges delegates to engine', () => {
      const { sim, engine } = setup();
      sim.onDraw = vi.fn();
      sim.fillEdges();
      expect(engine.fillEdges).toHaveBeenCalledWith(0.5);
    });

    it('fillCenter delegates to engine', () => {
      const { sim, engine } = setup();
      sim.onDraw = vi.fn();
      sim.fillCenter();
      expect(engine.fillCenter).toHaveBeenCalledWith(0.4);
    });

    it('invertAll delegates to engine', () => {
      const { sim, engine } = setup();
      sim.onDraw = vi.fn();
      sim.invertAll();
      expect(engine.invert).toHaveBeenCalled();
    });

    it('all block when running', () => {
      const { sim, engine } = setup();
      sim.isRunning = true;
      sim.fillEdges();
      sim.fillCenter();
      sim.invertAll();
      expect(engine.fillEdges).not.toHaveBeenCalled();
      expect(engine.fillCenter).not.toHaveBeenCalled();
      expect(engine.invert).not.toHaveBeenCalled();
    });
  });

  describe('loadPreset', () => {
    it('places pattern at center', () => {
      const { sim, engine } = setup();
      sim.onDraw = vi.fn();
      const getPattern = vi.fn(() => [[0, 1, 0], [0, 0, 1], [1, 1, 1]]);
      sim.loadPreset('glider', getPattern);
      expect(getPattern).toHaveBeenCalledWith('glider');
      expect(engine.placePattern).toHaveBeenCalled();
    });

    it('does nothing if pattern not found', () => {
      const { sim, engine } = setup();
      sim.onDraw = vi.fn();
      sim.loadPreset('unknown', () => null);
      expect(engine.placePattern).not.toHaveBeenCalled();
    });
  });

  describe('setSpeed', () => {
    it('updates speed and emits event', () => {
      const { sim, bus } = setup();
      const handler = vi.fn();
      bus.on('simulation:speedChanged', handler);
      sim.setSpeed(30);
      expect(sim.speed).toBe(30);
      expect(handler).toHaveBeenCalledWith({ speed: 30 });
    });
  });

  describe('generateRandomSeed', () => {
    it('generates seed and updates input', () => {
      const { sim } = setup();
      const seed = sim.generateRandomSeed();
      expect(seed).toBeGreaterThan(0);
      expect(sim.randomSeed).toBe(seed);
      expect((document.getElementById('randomSeedInput') as HTMLInputElement).value).toBe(String(seed));
    });
  });

  describe('updateInfo', () => {
    it('writes generation and population to DOM', () => {
      const { sim, engine } = setup();
      engine.generation = 42;
      (engine.getPopulation as any).mockReturnValue(15);
      sim.updateInfo();
      expect(document.getElementById('generationDisplay')!.textContent).toBe('42');
      expect(document.getElementById('populationDisplay')!.textContent).toBe('15');
    });
  });

  describe('updatePlayPauseUI', () => {
    it('shows pause icon when running', () => {
      const { sim } = setup();
      sim.isRunning = true;
      sim.updatePlayPauseUI();
      const icon = document.querySelector('#startStopBtn .btn-icon')!;
      expect(icon.getAttribute('data-lucide')).toBe('pause');
    });

    it('shows play icon when stopped', () => {
      const { sim } = setup();
      sim.isRunning = false;
      sim.updatePlayPauseUI();
      const icon = document.querySelector('#startStopBtn .btn-icon')!;
      expect(icon.getAttribute('data-lucide')).toBe('play');
    });
  });
});
