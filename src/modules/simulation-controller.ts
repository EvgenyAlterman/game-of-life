import { EventBus } from '../core/event-bus';
import { DomRegistry } from '../core/dom-registry';

export interface SimEngine {
  generation: number;
  grid: boolean[][];
  getPopulation(): number;
  getGridSnapshot(): any;
  restoreFromSnapshot(s: any): void;
  updateGeneration(): any;
  updateFadeGrid(duration: number): void;
  clear(): void;
  randomize(density: number, seed?: number | null): void;
  placePattern(pattern: number[][], row: number, col: number): void;
  fillEdges(density: number): void;
  fillCenter(density: number): void;
  invert(): void;
}

export interface SimulationControllerDeps {
  bus: EventBus;
  dom: DomRegistry;
  engine: SimEngine;
  canvas: HTMLCanvasElement;
}

export class SimulationController {
  private bus: EventBus;
  private dom: DomRegistry;
  private engine: SimEngine;

  public isRunning = false;
  public speed = 10;
  public lastTime = 0;
  public animationId: number | null = null;
  public randomDensity = 50;
  public randomSeed: number | null = null;
  public initialState: any = null;
  public rows: number;
  public cols: number;

  /** Hooks filled by the app composer */
  public onDraw: (() => void) | null = null;
  public onUpdateInfo: (() => void) | null = null;
  public onSaveSettings: (() => void) | null = null;
  public onAutoStopCheck: (() => void) | null = null;
  public onRecordingUpdate: (() => void) | null = null;
  public onRecordingClear: (() => void) | null = null;
  public onSessionCapture: (() => void) | null = null;
  public onSessionClear: (() => void) | null = null;
  public onHandleUnsavedRecording: (() => void) | null = null;
  public onUpdateFullscreenButton: (() => void) | null = null;

  public fadeMode = false;
  public fadeDuration = 5;

  constructor(deps: SimulationControllerDeps, rows: number, cols: number) {
    this.bus = deps.bus;
    this.dom = deps.dom;
    this.engine = deps.engine;
    this.rows = rows;
    this.cols = cols;
  }

  toggleSimulation(): void {
    this.isRunning = !this.isRunning;

    if (this.isRunning) {
      this.captureInitialState();
      this.animate(0);
    } else {
      if (this.animationId != null) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }

    this.updatePlayPauseUI();
    this.bus.emit(this.isRunning ? 'simulation:start' : 'simulation:stop');
  }

  animate(currentTime: number): void {
    if (!this.isRunning) return;

    const interval = 1000 / this.speed;
    if (currentTime - this.lastTime >= interval) {
      this.update();
      this.lastTime = currentTime;
    }

    this.animationId = requestAnimationFrame((t) => this.animate(t));
  }

  update(): void {
    this.engine.updateGeneration();

    if (this.onSessionCapture) this.onSessionCapture();
    if (this.fadeMode) this.engine.updateFadeGrid(this.fadeDuration);
    if (this.onRecordingUpdate) this.onRecordingUpdate();
    if (this.onAutoStopCheck) this.onAutoStopCheck();

    this.draw();
    this.updateInfo();

    this.bus.emit('simulation:tick', {
      generation: this.engine.generation,
      population: this.engine.getPopulation(),
    });
  }

  reset(): void {
    this.isRunning = false;
    if (this.onHandleUnsavedRecording) this.onHandleUnsavedRecording();
    if (this.onSessionClear) this.onSessionClear();

    this.updatePlayPauseUI();

    if (this.animationId != null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.initialState) {
      this.restoreInitialState();
    } else {
      this.engine.clear();
    }

    this.draw();
    this.updateInfo();
    if (this.onSaveSettings) this.onSaveSettings();
    this.bus.emit('simulation:reset');
  }

  captureInitialState(): void {
    this.initialState = this.engine.getGridSnapshot();
    if (this.onSessionCapture) this.onSessionCapture();
  }

  restoreInitialState(): void {
    if (!this.initialState) return;
    this.engine.restoreFromSnapshot(this.initialState);
  }

  randomize(): void {
    if (this.isRunning) return;
    if (this.onHandleUnsavedRecording) this.onHandleUnsavedRecording();
    if (this.onSessionClear) this.onSessionClear();

    this.engine.randomize(this.randomDensity / 100, this.randomSeed);
    this.initialState = null;

    this.draw();
    this.updateInfo();
    if (this.onSaveSettings) this.onSaveSettings();
  }

  clearAll(): void {
    if (this.isRunning) return;
    if (this.onHandleUnsavedRecording) this.onHandleUnsavedRecording();
    if (this.onSessionClear) this.onSessionClear();

    this.engine.clear();
    this.initialState = null;

    this.draw();
    this.updateInfo();
    if (this.onSaveSettings) this.onSaveSettings();
    this.bus.emit('grid:cleared');
  }

  fillEdges(): void {
    if (this.isRunning) return;
    this.engine.fillEdges(0.5);
    this.draw();
    this.updateInfo();
    if (this.onSaveSettings) this.onSaveSettings();
  }

  fillCenter(): void {
    if (this.isRunning) return;
    this.engine.fillCenter(0.4);
    this.draw();
    this.updateInfo();
    if (this.onSaveSettings) this.onSaveSettings();
  }

  invertAll(): void {
    if (this.isRunning) return;
    this.engine.invert();
    this.draw();
    this.updateInfo();
    if (this.onSaveSettings) this.onSaveSettings();
  }

  loadPreset(patternName: string, getPattern: (name: string) => number[][] | null): void {
    if (this.isRunning) return;
    this.clearAll();

    const centerRow = Math.floor(this.rows / 2);
    const centerCol = Math.floor(this.cols / 2);
    const pattern = getPattern(patternName);
    if (!pattern) return;

    this.engine.placePattern(pattern, centerRow, centerCol);
    this.draw();
    this.updateInfo();
    if (this.onSaveSettings) this.onSaveSettings();
  }

  setSpeed(speed: number): void {
    this.speed = speed;
    this.bus.emit('simulation:speedChanged', { speed });
  }

  generateRandomSeed(): number {
    const seed = Math.floor(Math.random() * 1000000);
    this.randomSeed = seed;
    const input = this.dom.get<HTMLInputElement>('randomSeedInput');
    if (input) input.value = String(seed);
    if (this.onSaveSettings) this.onSaveSettings();
    return seed;
  }

  // ---- UI helpers ----

  updateInfo(): void {
    const gen = this.dom.get<HTMLElement>('generationDisplay');
    const pop = this.dom.get<HTMLElement>('populationDisplay');
    if (gen) gen.textContent = String(this.engine.generation);
    if (pop) pop.textContent = String(this.engine.getPopulation());
    if (this.onUpdateInfo) this.onUpdateInfo();
  }

  draw(): void {
    if (this.onDraw) this.onDraw();
  }

  updatePlayPauseUI(): void {
    const btn = this.dom.get<HTMLElement>('startStopBtn');
    if (btn) {
      const icon = btn.querySelector('.btn-icon');
      if (icon) icon.setAttribute('data-lucide', this.isRunning ? 'pause' : 'play');
      btn.title = this.isRunning ? 'Pause Simulation' : 'Start Simulation';
      btn.classList.toggle('active', this.isRunning);
    }

    if (this.onUpdateFullscreenButton) this.onUpdateFullscreenButton();

    if (typeof window !== 'undefined' && (window as any).lucide) {
      setTimeout(() => {
        try { (window as any).lucide.createIcons(); } catch { /* ignore */ }
      }, 0);
    }
  }

  handleUnsavedRecording(): void {
    if (this.onHandleUnsavedRecording) this.onHandleUnsavedRecording();
  }

  showAutoRecordingNotification(): void {
    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      background: #4ade80; color: white; padding: 12px 16px;
      border-radius: 8px; font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000; display: flex; align-items: center; gap: 8px;
    `;
    el.innerHTML = '<span>🔴</span><span>Auto-recording started</span>';
    document.body.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 3000);
  }

  getState() {
    return {
      speed: this.speed,
      isRunning: this.isRunning,
      randomDensity: this.randomDensity,
      randomSeed: this.randomSeed,
    };
  }
}
