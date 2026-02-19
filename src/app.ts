/**
 * App — DI composer that wires all modules together.
 *
 * This replaces the monolithic GameOfLifeStudio class.
 * Each module is small (<300 lines), focused, and independently testable.
 */

import { createIcons, icons } from 'lucide';

import { EventBus } from './core/event-bus';
import { StorageService } from './core/storage-service';
import { DomRegistry } from './core/dom-registry';
import { Modal } from './core/modal';

import { GameOfLifeEngine } from './js/game-engine';
import { GameOfLifePatterns } from './js/patterns';

import { CanvasRenderer } from './modules/canvas-renderer';
import { ThemeManager } from './modules/theme';
import { SidebarManager } from './modules/sidebar';
import { VisualSettingsManager } from './modules/visual-settings';
import { DrawingToolsManager } from './modules/drawing-tools';
import { InspectorManager } from './modules/inspector';
import { InputHandler } from './modules/input-handler';
import { PatternManager } from './modules/pattern-manager';
import { SelectionManager } from './modules/selection-manager';
import { AutoStopManager } from './modules/auto-stop';
import { CustomRulesManager } from './modules/custom-rules';
import { GridSettingsManager } from './modules/grid-settings';
import { SessionHistoryManager } from './modules/session-history';
import { FullscreenManager } from './modules/fullscreen';
import { SimulationController } from './modules/simulation-controller';
import { SettingsPersistence } from './modules/settings-persistence';
import { RecordingManager } from './recording-manager';
import { EventWiring } from './modules/event-wiring';

export class App {
  // Core
  public bus: EventBus;
  public storage: StorageService;
  public dom: DomRegistry;

  // Engine
  public engine: GameOfLifeEngine;

  // Modules
  public renderer: CanvasRenderer;
  public theme: ThemeManager;
  public sidebar: SidebarManager;
  public visual: VisualSettingsManager;
  public tools: DrawingToolsManager;
  public inspector: InspectorManager;
  public input: InputHandler;
  public patterns: PatternManager;
  public selection: SelectionManager;
  public autoStop: AutoStopManager;
  public customRules: CustomRulesManager;
  public gridSettings: GridSettingsManager;
  public session: SessionHistoryManager;
  public fullscreen: FullscreenManager;
  public sim: SimulationController;
  public persistence: SettingsPersistence;
  public recordingManager: RecordingManager;
  public wiring: EventWiring;

  // Canvas reference for EventWiring
  private canvas: HTMLCanvasElement;

  // Convenience proxies used by RecordingManager host interface
  public get cellSize() { return this.gridSettings.cellSize; }
  public get rows() { return this.gridSettings.rows; }
  public get cols() { return this.gridSettings.cols; }
  public get speed() { return this.sim.speed; }
  public get isRunning() { return this.sim.isRunning; }

  constructor(canvasId: string) {
    // ---- Core ----
    this.bus = new EventBus();
    this.storage = new StorageService();
    this.dom = new DomRegistry();

    this.canvas = this.dom.require<HTMLCanvasElement>(canvasId);
    const cellSize = 10;
    const rows = Math.floor(this.canvas.height / cellSize);
    const cols = Math.floor(this.canvas.width / cellSize);

    // ---- Engine ----
    this.engine = new GameOfLifeEngine(rows, cols);

    // ---- Renderer ----
    this.renderer = new CanvasRenderer(this.canvas, this.engine, this.bus, rows, cols, cellSize);

    // ---- UI chrome ----
    this.theme = new ThemeManager(this.bus, this.storage, this.dom);
    this.sidebar = new SidebarManager(this.bus, this.storage, this.dom);
    this.visual = new VisualSettingsManager(this.bus, this.dom);

    // ---- Tools + input ----
    this.tools = new DrawingToolsManager(this.bus, this.dom);
    this.inspector = new InspectorManager(this.engine as any);
    this.input = new InputHandler(this.bus, this.renderer as any, this.tools, this.inspector, this.engine as any);
    this.patterns = new PatternManager(this.bus, this.storage, this.dom);
    this.selection = new SelectionManager(this.bus, this.dom, this.engine as any, this.renderer as any, this.patterns);

    // ---- Settings managers ----
    this.autoStop = new AutoStopManager(this.bus, this.dom, this.engine);
    this.customRules = new CustomRulesManager(this.bus, this.dom, this.engine as any);
    this.gridSettings = new GridSettingsManager(this.bus, this.dom, this.engine as any, this.canvas, rows, cols, cellSize);
    this.session = new SessionHistoryManager(this.bus, this.engine as any);
    this.fullscreen = new FullscreenManager(this.bus, this.dom, this.engine as any, this.canvas, rows, cols, cellSize);

    // ---- Simulation controller ----
    this.sim = new SimulationController({ bus: this.bus, dom: this.dom, engine: this.engine as any, canvas: this.canvas }, rows, cols);

    // ---- Recording ----
    this.recordingManager = new RecordingManager(this.bus, this.dom, this.engine as any, this as any);

    // ---- Persistence ----
    this.persistence = new SettingsPersistence(
      this.bus, this.storage, this.dom,
      {
        gridSettings: this.gridSettings,
        visualSettings: this.visual,
        autoStop: this.autoStop,
        customRules: this.customRules,
        drawingTools: this.tools,
        sidebar: this.sidebar,
      },
      this.engine as any,
      this.canvas,
    );

    // ---- Event Wiring ----
    this.wiring = new EventWiring({
      bus: this.bus,
      dom: this.dom,
      sim: this.sim,
      sidebar: this.sidebar,
      theme: this.theme,
      visual: this.visual,
      tools: this.tools,
      gridSettings: this.gridSettings,
      autoStop: this.autoStop,
      customRules: this.customRules,
      fullscreen: this.fullscreen,
      patterns: this.patterns,
      selection: this.selection,
      input: this.input,
      canvas: this.canvas,
      engine: this.engine,
      patternsLib: GameOfLifePatterns,
      persistence: this.persistence,
      onSaveSettings: () => this.persistence.save(),
    });

    // ---- Wire callbacks ----
    this.wireCallbacks();
  }

  private wireCallbacks(): void {
    // SimulationController hooks
    this.sim.onDraw = () => this.draw();
    this.sim.onUpdateInfo = () => {};
    this.sim.onSaveSettings = () => this.persistence.save();
    this.sim.onAutoStopCheck = () => this.autoStop.check();
    this.sim.onRecordingUpdate = () => this.recordingManager.onGenerationUpdate();
    this.sim.onRecordingClear = () => this.recordingManager.clearRecording();
    this.sim.onSessionCapture = () => this.session.addFrame();
    this.sim.onSessionClear = () => this.session.clear();
    this.sim.onHandleUnsavedRecording = () => this.handleUnsavedRecording();
    this.sim.onUpdateFullscreenButton = () => this.fullscreen.updatePlayPauseButton();

    // AutoStop hooks
    this.autoStop.onStop = () => {
      this.sim.isRunning = false;
      if (this.sim.animationId != null) cancelAnimationFrame(this.sim.animationId);
      this.sim.updatePlayPauseUI();
      this.bus.emit('simulation:stop');
    };

    // Grid settings
    this.gridSettings.onResize = (r, c, cs) => {
      this.renderer.resize(r, c, cs);
      this.sim.rows = r;
      this.sim.cols = c;
      this.fullscreen.rows = r;
      this.fullscreen.cols = c;
      this.fullscreen.cellSize = cs;
      this.draw();
      this.sim.updateInfo();
    };

    // Fullscreen
    this.fullscreen.onResize = (r, c, cs) => {
      this.renderer.resize(r, c, cs);
      this.sim.rows = r;
      this.sim.cols = c;
      this.gridSettings.rows = r;
      this.gridSettings.cols = c;
      this.gridSettings.cellSize = cs;
      this.draw();
      this.sim.updateInfo();
    };

    // Session history
    this.session.onStateRestored = () => {
      this.draw();
      this.sim.updateInfo();
    };

    // InputHandler hooks
    this.input.onUpdateInfo = () => this.sim.updateInfo();
    this.input.onSaveSettings = () => this.persistence.save();
    this.input.onShowSavePatternModal = () => {
      this.selection.showSaveModal(this.input.getSelectionStart(), this.input.getSelectionEnd());
    };
    this.input.onHasValidSelection = () => {
      return this.selection.hasValidSelection(this.input.getSelectionStart(), this.input.getSelectionEnd());
    };
    this.input.onGetRotatedPattern = (p: number[][], deg: number) => PatternManager.rotatePattern(p, deg);

    // PatternManager hooks
    this.patterns.onSelectDrawingPattern = (name: string) => {
      const pat = GameOfLifePatterns.getPattern(name);
      if (pat) this.tools.selectPattern(name, pat);
    };
    this.patterns.onSelectCustomPattern = (name: string) => {
      const customs = this.storage.getCustomPatterns();
      const found = customs.find((c: any) => c.name === name);
      if (found) this.tools.selectCustomPattern(name, found.pattern);
    };

    // Sync renderer whenever settings are loaded (initial load + import)
    this.bus.on('settings:loaded', () => {
      const g = this.gridSettings;
      this.renderer.resize(g.rows, g.cols, g.cellSize);
      this.sim.rows = g.rows;
      this.sim.cols = g.cols;
      this.fullscreen.rows = g.rows;
      this.fullscreen.cols = g.cols;
      this.fullscreen.cellSize = g.cellSize;

      // Sync speed from slider (persistence updates DOM but not sim)
      const speedSlider = this.dom.get<HTMLInputElement>('speedSlider');
      if (speedSlider) this.sim.setSpeed(parseInt(speedSlider.value, 10) || 10);

      this.draw();
      this.updateSidebarFooter();
    });

    // Sidebar footer stats
    this.bus.on('grid:resized', () => this.updateSidebarFooter());
    this.bus.on('settings:changed', () => this.updateSidebarFooter());

    // Visual settings → renderer sync
    this.bus.on('visual:gridToggled', () => this.syncVisuals());
    this.bus.on('visual:pixelGridToggled', () => this.syncVisuals());
    this.bus.on('visual:fadeToggled', () => this.syncVisuals());
    this.bus.on('visual:fadeDurationChanged', () => this.syncVisuals());
    this.bus.on('visual:maturityToggled', () => this.syncVisuals());
    this.bus.on('visual:cellShapeChanged', () => this.syncVisuals());
    this.bus.on('visual:maturityColorChanged', () => this.syncVisuals());

    // Simulation state → input handler
    this.bus.on('simulation:start', () => { this.input.isRunning = true; this.fullscreen.isRunning = true; });
    this.bus.on('simulation:stop', () => { this.input.isRunning = false; this.fullscreen.isRunning = false; });
  }

  private syncVisuals(): void {
    const vs = this.visual.getState();
    this.renderer.setVisualFlags({
      showGrid: vs.showGrid,
      showPixelGrid: vs.showPixelGrid,
      fadeMode: vs.showFade,
      maturityMode: vs.showMaturity,
      cellShape: vs.cellShape,
      maturityEndColor: vs.maturityColor,
      fadeDuration: vs.fadeDuration,
    });
    this.sim.fadeMode = vs.showFade;
    this.sim.fadeDuration = vs.fadeDuration;
    this.inspector.fadeMode = vs.showFade;
    this.inspector.maturityMode = vs.showMaturity;
  }

  private async handleUnsavedRecording(): Promise<void> {
    // With auto-recording, we don't need to prompt - users can save anytime via the timeline
    // The recording buffer persists until explicitly cleared via the reset button
  }

  // ---- Public API ----

  draw(): void {
    this.renderer.draw();
  }

  updateInfo(): void {
    this.sim.updateInfo();
  }

  toggleSimulation(): void {
    this.sim.toggleSimulation();
  }

  saveSettings(): void {
    this.persistence.save();
  }

  updateRuleDisplay(): void {
    this.customRules.updateRuleDisplay();
  }

  private updateSidebarFooter(): void {
    const gridEl = this.dom.get<HTMLElement>('sidebarStatGrid');
    const cellEl = this.dom.get<HTMLElement>('sidebarStatCell');
    const ruleEl = this.dom.get<HTMLElement>('sidebarStatRule');
    if (gridEl) gridEl.textContent = `${this.gridSettings.rows}×${this.gridSettings.cols}`;
    if (cellEl) cellEl.textContent = `${this.gridSettings.cellSize}px`;
    if (ruleEl) ruleEl.textContent = this.customRules.getState().ruleString;
  }

  updateCheckboxesFromRules(): void {
    this.customRules.updateCheckboxesFromRules();
  }

  // ---- Initialisation ----

  initialize(): void {
    // Theme + sidebar
    this.theme.initialize();
    this.sidebar.setupCollapsibleSections();

    // Wire all event listeners (buttons, sliders, canvas, keyboard)
    this.wiring.setupAll();

    // Set up pattern search function
    this.patterns.setSearchFunction((q: string) => GameOfLifePatterns.search(q));

    // Load persisted settings (triggers settings:loaded → renderer sync)
    this.persistence.load();

    // Sync visual settings to renderer
    this.syncVisuals();

    // Custom rules
    this.customRules.initialize();

    // Pattern tree
    this.patterns.initializePatternTree(GameOfLifePatterns as any);

    // Initial UI state
    this.tools.updateUI();
    this.tools.updatePatternHints();
    this.autoStop.updateUI();
    this.draw();
    this.sim.updateInfo();
    this.updateSidebarFooter();

    // Load existing recordings
    this.recordingManager.loadRecordings();
  }

  placeDemoGlider(): void {
    const centerRow = Math.floor(this.rows / 2);
    const centerCol = Math.floor(this.cols / 2);
    const pattern = GameOfLifePatterns.getPattern('glider');
    if (pattern) {
      this.engine.placePattern(pattern, centerRow, centerCol);
      this.draw();
      this.sim.updateInfo();
      this.persistence.save();
    }
  }
}

// ---- Entry point ----

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  createIcons({ icons });

  const app = new App('gameCanvas');
  app.initialize();

  // Re-initialize icons after dynamic content is created
  createIcons({ icons });

  // Make lucide available globally for dynamic icon updates
  (window as any).lucide = { createIcons: () => createIcons({ icons }) };

  // Global reference for recording list inline handlers
  (window as any).game = app;

  // Demo glider if no saved settings
  if (!localStorage.getItem('gameoflife-settings')) {
    setTimeout(() => app.placeDemoGlider(), 100);
  }
});
