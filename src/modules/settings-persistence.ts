import { EventBus } from '../core/event-bus';
import { StorageService } from '../core/storage-service';
import { DomRegistry } from '../core/dom-registry';
import { getDefaultSettings } from '../core/default-settings';
import { exportSettings, triggerImport, type ImportResult } from './settings-export';

/**
 * Each module exposes getState() and loadState() — SettingsPersistence
 * orchestrates save/load across all modules.
 */

export interface ModuleWithState<T> {
  getState(): T;
  loadState(s: Partial<T>): void;
}

export interface SettingsSnapshot {
  gridSettings?: any;
  visualSettings?: any;
  autoStop?: any;
  customRules?: any;
  drawingTools?: any;
  eraser?: { brushSize: number; brushShape: string };
  speed?: number;
  randomDensity?: number;
  randomSeed?: string | null;
  gridSnapshot?: any;
  generation?: number;
  sliderMaxes?: Record<string, string>;
  sidebarCollapsed?: boolean;
  activeTab?: string;
  timestamp?: number;
}

export interface SidebarModule {
  getActiveTab(): string;
  setActiveTab(tabId: string): void;
}

export interface PersistenceModules {
  gridSettings?: ModuleWithState<any>;
  visualSettings?: ModuleWithState<any>;
  autoStop?: ModuleWithState<any>;
  customRules?: ModuleWithState<any>;
  drawingTools?: ModuleWithState<any>;
  sidebar?: SidebarModule;
}

export interface PersistenceEngine {
  generation: number;
  getGridSnapshot(): any;
  restoreFromSnapshot(s: any): void;
  setCell(row: number, col: number, alive: boolean): void;
  birthRules: number[];
  survivalRules: number[];
  setBirthRules(r: number[]): void;
  setSurvivalRules(r: number[]): void;
  getRulesAsString(): string;
  resize(rows: number, cols: number): void;
}

export class SettingsPersistence {
  private bus: EventBus;
  private storage: StorageService;
  private dom: DomRegistry;
  private modules: PersistenceModules;
  private engine: PersistenceEngine;
  private canvas: HTMLCanvasElement;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /** Called after settings are loaded so host can redraw */
  public onLoaded: (() => void) | null = null;

  constructor(
    bus: EventBus,
    storage: StorageService,
    dom: DomRegistry,
    modules: PersistenceModules,
    engine: PersistenceEngine,
    canvas: HTMLCanvasElement,
  ) {
    this.bus = bus;
    this.storage = storage;
    this.dom = dom;
    this.modules = modules;
    this.engine = engine;
    this.canvas = canvas;

    // Auto-save on settings:changed with debounce
    this.bus.on('settings:changed', () => this.debounceSave());
  }

  private debounceSave(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.save(), 500);
  }

  save(): void {
    const snapshot: SettingsSnapshot = { timestamp: Date.now() };

    if (this.modules.gridSettings) snapshot.gridSettings = this.modules.gridSettings.getState();
    if (this.modules.visualSettings) snapshot.visualSettings = this.modules.visualSettings.getState();
    if (this.modules.autoStop) snapshot.autoStop = this.modules.autoStop.getState();
    if (this.modules.customRules) snapshot.customRules = this.modules.customRules.getState();
    if (this.modules.drawingTools) snapshot.drawingTools = this.modules.drawingTools.getState();

    // Engine state
    snapshot.gridSnapshot = this.engine.getGridSnapshot();
    snapshot.generation = this.engine.generation;

    // Slider max values (read from DOM)
    snapshot.sliderMaxes = {};
    for (const id of ['speedMax', 'gridWidthMax', 'gridHeightMax', 'cellSizeMax', 'randomDensityMax', 'fadeMax']) {
      const el = this.dom.get<HTMLInputElement>(id);
      if (el) snapshot.sliderMaxes[id] = el.value;
    }

    // Speed + random density (simulation-level state not in a module yet)
    const speedSlider = this.dom.get<HTMLInputElement>('speedSlider');
    if (speedSlider) snapshot.speed = parseInt(speedSlider.value, 10);

    const densitySlider = this.dom.get<HTMLInputElement>('randomDensitySlider');
    if (densitySlider) snapshot.randomDensity = parseInt(densitySlider.value, 10);

    const seedInput = this.dom.get<HTMLInputElement>('randomSeedInput');
    if (seedInput) snapshot.randomSeed = seedInput.value || null;

    // Sidebar collapsed
    const sidebar = this.dom.query<HTMLElement>('.sidebar');
    if (sidebar) snapshot.sidebarCollapsed = sidebar.classList.contains('collapsed');

    // Active tab
    if (this.modules.sidebar) {
      snapshot.activeTab = this.modules.sidebar.getActiveTab();
    }

    this.storage.saveSettings(snapshot as any);
  }

  load(): void {
    const saved = this.storage.getSettings() as SettingsSnapshot | null;
    const settings = saved || getDefaultSettings();
    const isDefaults = !saved;

    // Distribute to modules
    if (settings.gridSettings && this.modules.gridSettings) {
      this.modules.gridSettings.loadState(settings.gridSettings);

      // Also resize canvas + engine
      const gs = settings.gridSettings;
      if (gs.rows && gs.cols && gs.cellSize) {
        this.canvas.width = gs.cols * gs.cellSize;
        this.canvas.height = gs.rows * gs.cellSize;
        this.engine.resize(gs.rows, gs.cols);
      }
    }

    // Restore grid snapshot
    if (settings.gridSnapshot) {
      this.engine.restoreFromSnapshot(settings.gridSnapshot);
    }

    if (settings.visualSettings && this.modules.visualSettings) {
      this.modules.visualSettings.loadState(settings.visualSettings);
    }

    if (settings.autoStop && this.modules.autoStop) {
      this.modules.autoStop.loadState(settings.autoStop);
    }

    if (settings.customRules && this.modules.customRules) {
      this.modules.customRules.loadState(settings.customRules);
    }

    if (settings.drawingTools && this.modules.drawingTools) {
      this.modules.drawingTools.loadState(settings.drawingTools);
    }

    // Slider max values
    if (settings.sliderMaxes) {
      for (const [id, val] of Object.entries(settings.sliderMaxes)) {
        const el = this.dom.get<HTMLInputElement>(id);
        if (el) el.value = val;
        // Also update corresponding slider's max attribute
        const sliderId = id.replace('Max', 'Slider');
        const slider = this.dom.get<HTMLInputElement>(sliderId);
        if (slider) slider.max = val;
      }
    }

    // Speed
    if (settings.speed !== undefined) {
      const speedSlider = this.dom.get<HTMLInputElement>('speedSlider');
      const speedValue = this.dom.get<HTMLElement>('speedValue');
      if (speedSlider) speedSlider.value = String(settings.speed);
      if (speedValue) speedValue.textContent = String(settings.speed);
    }

    // Random density
    if (settings.randomDensity !== undefined) {
      const slider = this.dom.get<HTMLInputElement>('randomDensitySlider');
      const display = this.dom.get<HTMLElement>('randomDensityValue');
      if (slider) slider.value = String(settings.randomDensity);
      if (display) display.textContent = settings.randomDensity + '%';
    }

    // Random seed
    if (settings.randomSeed !== undefined) {
      const input = this.dom.get<HTMLInputElement>('randomSeedInput');
      if (input && settings.randomSeed) input.value = settings.randomSeed;
    }

    // Sidebar
    if (settings.sidebarCollapsed) {
      const sidebar = this.dom.query<HTMLElement>('.sidebar');
      if (sidebar) sidebar.classList.add('collapsed');
    }

    // Active tab
    if (settings.activeTab && this.modules.sidebar) {
      this.modules.sidebar.setActiveTab(settings.activeTab);
    }

    // Save defaults to localStorage so they persist
    if (isDefaults) {
      this.save();
    }

    this.bus.emit('settings:loaded');
    if (this.onLoaded) this.onLoaded();
  }

  /**
   * Export current settings to a downloadable JSON file.
   */
  exportToFile(): void {
    const snapshot: SettingsSnapshot = { timestamp: Date.now() };

    if (this.modules.gridSettings) snapshot.gridSettings = this.modules.gridSettings.getState();
    if (this.modules.visualSettings) snapshot.visualSettings = this.modules.visualSettings.getState();
    if (this.modules.autoStop) snapshot.autoStop = this.modules.autoStop.getState();
    if (this.modules.customRules) snapshot.customRules = this.modules.customRules.getState();
    if (this.modules.drawingTools) snapshot.drawingTools = this.modules.drawingTools.getState();

    snapshot.gridSnapshot = this.engine.getGridSnapshot();
    snapshot.generation = this.engine.generation;

    const speedSlider = this.dom.get<HTMLInputElement>('speedSlider');
    if (speedSlider) snapshot.speed = parseInt(speedSlider.value, 10);

    const densitySlider = this.dom.get<HTMLInputElement>('randomDensitySlider');
    if (densitySlider) snapshot.randomDensity = parseInt(densitySlider.value, 10);

    exportSettings(snapshot);
  }

  /**
   * Import settings from a file. Opens file picker.
   */
  importFromFile(): void {
    triggerImport((result: ImportResult) => {
      if (result.success && result.settings) {
        this.applySettings(result.settings);
        this.save();
        this.bus.emit('settings:imported');
      } else {
        this.bus.emit('settings:importFailed', result.error || 'Unknown error');
      }
    });
  }

  /**
   * Apply a settings snapshot (used by import).
   */
  private applySettings(settings: SettingsSnapshot): void {
    if (settings.gridSettings && this.modules.gridSettings) {
      this.modules.gridSettings.loadState(settings.gridSettings);
      const gs = settings.gridSettings;
      if (gs.rows && gs.cols && gs.cellSize) {
        this.canvas.width = gs.cols * gs.cellSize;
        this.canvas.height = gs.rows * gs.cellSize;
        this.engine.resize(gs.rows, gs.cols);
      }
    }

    if (settings.gridSnapshot) {
      this.engine.restoreFromSnapshot(settings.gridSnapshot);
    }

    if (settings.visualSettings && this.modules.visualSettings) {
      this.modules.visualSettings.loadState(settings.visualSettings);
    }

    if (settings.autoStop && this.modules.autoStop) {
      this.modules.autoStop.loadState(settings.autoStop);
    }

    if (settings.customRules && this.modules.customRules) {
      this.modules.customRules.loadState(settings.customRules);
    }

    if (settings.drawingTools && this.modules.drawingTools) {
      this.modules.drawingTools.loadState(settings.drawingTools);
    }

    if (settings.speed !== undefined) {
      const speedSlider = this.dom.get<HTMLInputElement>('speedSlider');
      const speedValue = this.dom.get<HTMLElement>('speedValue');
      if (speedSlider) speedSlider.value = String(settings.speed);
      if (speedValue) speedValue.textContent = String(settings.speed);
    }

    if (settings.randomDensity !== undefined) {
      const slider = this.dom.get<HTMLInputElement>('randomDensitySlider');
      const display = this.dom.get<HTMLElement>('randomDensityValue');
      if (slider) slider.value = String(settings.randomDensity);
      if (display) display.textContent = settings.randomDensity + '%';
    }

    this.bus.emit('settings:loaded');
    if (this.onLoaded) this.onLoaded();
  }
}
