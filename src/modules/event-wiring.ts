/**
 * EventWiring — Connects all DOM elements to their respective module handlers.
 * This replaces the monolithic setupEventListeners() from GameOfLifeStudio.
 */

import type { EventBus } from '../core/event-bus';
import type { DomRegistry } from '../core/dom-registry';
import type { SimulationController } from './simulation-controller';
import type { SidebarManager } from './sidebar';
import type { ThemeManager } from './theme';
import type { VisualSettingsManager } from './visual-settings';
import type { DrawingToolsManager } from './drawing-tools';
import type { GridSettingsManager } from './grid-settings';
import type { AutoStopManager } from './auto-stop';
import type { CustomRulesManager } from './custom-rules';
import type { FullscreenManager } from './fullscreen';
import type { PatternManager } from './pattern-manager';
import type { SelectionManager } from './selection-manager';
import type { InputHandler } from './input-handler';
import type { GameOfLifeEngine } from '../js/game-engine';
import type { GameOfLifePatterns as PatternsLib } from '../js/patterns';
import type { SettingsPersistence } from './settings-persistence';

declare const lucide: { createIcons: () => void };

export interface EventWiringDeps {
  bus: EventBus;
  dom: DomRegistry;
  sim: SimulationController;
  sidebar: SidebarManager;
  theme: ThemeManager;
  visual: VisualSettingsManager;
  tools: DrawingToolsManager;
  gridSettings: GridSettingsManager;
  autoStop: AutoStopManager;
  customRules: CustomRulesManager;
  fullscreen: FullscreenManager;
  patterns: PatternManager;
  selection: SelectionManager;
  input: InputHandler;
  canvas: HTMLCanvasElement;
  engine: GameOfLifeEngine;
  patternsLib: typeof PatternsLib;
  persistence: SettingsPersistence;
  onSaveSettings: () => void;
}

export class EventWiring {
  private deps: EventWiringDeps;

  constructor(deps: EventWiringDeps) {
    this.deps = deps;
  }

  /**
   * Wire all event listeners. Call this once during app initialization.
   */
  setupAll(): void {
    this.wireSimulationControls();
    this.wireSidebarControls();
    this.wireVisualToggles();
    this.wireGridSettings();
    this.wireAutoStopSettings();
    this.wireCustomRules();
    this.wireFullscreenControls();
    this.wireDrawingTools();
    this.wirePatternControls();
    this.wireCanvasEvents();
    this.wireKeyboardEvents();
    this.wireSavePatternModal();
    this.wireMaxToggleButtons();
    this.wireSettingsExportImport();
  }

  // ─── Simulation Controls ─────────────────────────────────────

  private wireSimulationControls(): void {
    const { dom, sim, onSaveSettings } = this.deps;

    // Start/Stop button
    const startStopBtn = dom.get('startStopBtn');
    startStopBtn?.addEventListener('click', () => sim.toggleSimulation());

    // Reset button
    const resetBtn = dom.get('resetBtn');
    resetBtn?.addEventListener('click', () => sim.reset());

    // Clear button
    const clearBtn = dom.get('clearBtn');
    clearBtn?.addEventListener('click', () => sim.clearAll());

    // Random button
    const randomBtn = dom.get('randomBtn');
    randomBtn?.addEventListener('click', () => sim.randomize());

    // Speed slider
    const speedSlider = dom.get<HTMLInputElement>('speedSlider');
    const speedValue = dom.get('speedValue');
    speedSlider?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      sim.setSpeed(value);
      if (speedValue) speedValue.textContent = String(value);
      onSaveSettings();
    });

    // Speed max
    const speedMax = dom.get<HTMLInputElement>('speedMax');
    speedMax?.addEventListener('input', (e) => {
      this.updateSliderMax(speedSlider, (e.target as HTMLInputElement).value);
      onSaveSettings();
    });

    // Random density slider
    const randomDensitySlider = dom.get<HTMLInputElement>('randomDensitySlider');
    const randomDensityValue = dom.get('randomDensityValue');
    randomDensitySlider?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      sim.randomDensity = value;
      if (randomDensityValue) randomDensityValue.textContent = value + '%';
      onSaveSettings();
    });

    // Random density max
    const randomDensityMax = dom.get<HTMLInputElement>('randomDensityMax');
    randomDensityMax?.addEventListener('input', (e) => {
      this.updateSliderMax(randomDensitySlider, (e.target as HTMLInputElement).value);
      onSaveSettings();
    });

    // Generate seed button
    const generateSeedBtn = dom.get('generateSeedBtn');
    generateSeedBtn?.addEventListener('click', () => sim.generateRandomSeed());

    // Random seed input
    const randomSeedInput = dom.get<HTMLInputElement>('randomSeedInput');
    randomSeedInput?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      sim.randomSeed = value ? parseInt(value) : null;
      onSaveSettings();
    });

    // Quick action buttons
    const fillRandomBtn = document.getElementById('fillRandomBtn');
    fillRandomBtn?.addEventListener('click', () => {
      sim.randomize();
    });

    const fillEdgesBtn = document.getElementById('fillEdgesBtn');
    fillEdgesBtn?.addEventListener('click', () => sim.fillEdges());

    const fillCenterBtn = document.getElementById('fillCenterBtn');
    fillCenterBtn?.addEventListener('click', () => sim.fillCenter());

    const invertBtn = document.getElementById('invertBtn');
    invertBtn?.addEventListener('click', () => sim.invertAll());
  }

  // ─── Sidebar Controls ────────────────────────────────────────

  private wireSidebarControls(): void {
    const { dom, sidebar, theme, onSaveSettings } = this.deps;

    // Sidebar toggle
    const sidebarToggle = dom.get('sidebarToggle');
    sidebarToggle?.addEventListener('click', () => {
      sidebar.toggle();
      onSaveSettings();
    });

    // Sidebar tab navigation
    document.querySelectorAll('.sidebar-nav-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = (btn as HTMLElement).dataset.tab;
        if (tabId) {
          sidebar.switchTab(tabId);
          onSaveSettings();
        }
      });
    });

    // Mobile menu button
    const mobileMenuBtn = dom.get('mobileMenuBtn');
    mobileMenuBtn?.addEventListener('click', () => sidebar.openMobile());

    // Sidebar overlay (for mobile)
    const sidebarOverlay = dom.get('sidebarOverlay');
    sidebarOverlay?.addEventListener('click', () => sidebar.closeMobile());

    // Dark mode toggle
    const darkModeToggle = dom.get('darkModeToggle');
    darkModeToggle?.addEventListener('click', () => theme.toggle());
  }

  // ─── Visual Toggles ──────────────────────────────────────────

  private wireVisualToggles(): void {
    const { dom, visual, engine, onSaveSettings } = this.deps;

    // Pixel grid toggle
    const pixelGridToggle = dom.get('pixelGridToggle');
    pixelGridToggle?.addEventListener('click', () => {
      visual.togglePixelGrid();
      onSaveSettings();
    });

    // Grid toggle
    const gridToggle = dom.get('gridToggle');
    gridToggle?.addEventListener('click', () => {
      visual.toggleGrid();
      onSaveSettings();
    });

    // Fade toggle
    const fadeToggle = dom.get('fadeToggle');
    fadeToggle?.addEventListener('click', () => {
      visual.toggleFadeMode(engine);
      onSaveSettings();
    });

    // Fade duration slider
    const fadeSlider = dom.get<HTMLInputElement>('fadeSlider');
    const fadeValue = dom.get('fadeValue');
    fadeSlider?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      visual.setFadeDuration(value);
      if (fadeValue) fadeValue.textContent = String(value);
      onSaveSettings();
    });

    // Fade max
    const fadeMax = dom.get<HTMLInputElement>('fadeMax');
    fadeMax?.addEventListener('input', (e) => {
      this.updateSliderMax(fadeSlider, (e.target as HTMLInputElement).value);
      onSaveSettings();
    });

    // Maturity toggle
    const maturityToggle = dom.get('maturityToggle');
    maturityToggle?.addEventListener('click', () => {
      visual.toggleMaturityMode(engine);
      onSaveSettings();
    });

    // Maturity color picker
    const maturityColor = dom.get<HTMLInputElement>('maturityColor');
    maturityColor?.addEventListener('input', (e) => {
      visual.setMaturityColor((e.target as HTMLInputElement).value);
      onSaveSettings();
    });

    // Cell shape toggle
    const cellShapeToggle = dom.get('cellShapeToggle');
    cellShapeToggle?.addEventListener('click', () => {
      visual.toggleCellShape();
      onSaveSettings();
    });
  }

  // ─── Grid Settings ───────────────────────────────────────────

  private wireGridSettings(): void {
    const { dom, gridSettings, fullscreen, onSaveSettings } = this.deps;

    // Grid width slider
    const gridWidthSlider = dom.get<HTMLInputElement>('gridWidthSlider');
    const gridWidthValue = dom.get('gridWidthValue');
    gridWidthSlider?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      if (gridWidthValue) gridWidthValue.textContent = String(value);
      gridSettings.liveResize(fullscreen.isFullscreen);
      onSaveSettings();
    });

    const gridWidthMax = dom.get<HTMLInputElement>('gridWidthMax');
    gridWidthMax?.addEventListener('input', (e) => {
      this.updateSliderMax(gridWidthSlider, (e.target as HTMLInputElement).value);
      onSaveSettings();
    });

    // Grid height slider
    const gridHeightSlider = dom.get<HTMLInputElement>('gridHeightSlider');
    const gridHeightValue = dom.get('gridHeightValue');
    gridHeightSlider?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      if (gridHeightValue) gridHeightValue.textContent = String(value);
      gridSettings.liveResize(fullscreen.isFullscreen);
      onSaveSettings();
    });

    const gridHeightMax = dom.get<HTMLInputElement>('gridHeightMax');
    gridHeightMax?.addEventListener('input', (e) => {
      this.updateSliderMax(gridHeightSlider, (e.target as HTMLInputElement).value);
      onSaveSettings();
    });

    // Cell size slider
    const cellSizeSlider = dom.get<HTMLInputElement>('cellSizeSlider');
    const cellSizeValue = dom.get('cellSizeValue');
    cellSizeSlider?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      if (cellSizeValue) cellSizeValue.textContent = value + 'px';
      gridSettings.liveResize(fullscreen.isFullscreen);
      onSaveSettings();
    });

    const cellSizeMax = dom.get<HTMLInputElement>('cellSizeMax');
    cellSizeMax?.addEventListener('input', (e) => {
      this.updateSliderMax(cellSizeSlider, (e.target as HTMLInputElement).value);
      onSaveSettings();
    });

    // Fit-to-viewport buttons
    const fitWidthBtn = dom.get('fitWidthBtn');
    fitWidthBtn?.addEventListener('click', () => {
      const container = dom.query<HTMLElement>('.game-container');
      if (!container || !gridWidthSlider || !cellSizeSlider) return;
      const cellSize = parseInt(cellSizeSlider.value, 10);
      const availableWidth = container.clientWidth - 20 - 3; // padding (10px each side) minus 3px
      const fitCols = Math.floor(availableWidth / cellSize);
      const clamped = Math.max(parseInt(gridWidthSlider.min, 10), Math.min(fitCols, parseInt(gridWidthSlider.max, 10)));
      gridWidthSlider.value = String(clamped);
      if (gridWidthValue) gridWidthValue.textContent = String(clamped);
      gridSettings.liveResize(fullscreen.isFullscreen);
      onSaveSettings();
    });

    const fitHeightBtn = dom.get('fitHeightBtn');
    fitHeightBtn?.addEventListener('click', () => {
      const container = dom.query<HTMLElement>('.game-container');
      if (!container || !gridHeightSlider || !cellSizeSlider) return;
      const cellSize = parseInt(cellSizeSlider.value, 10);
      const availableHeight = container.clientHeight - 20 - 3; // padding (10px each side) minus 3px
      const fitRows = Math.floor(availableHeight / cellSize);
      const clamped = Math.max(parseInt(gridHeightSlider.min, 10), Math.min(fitRows, parseInt(gridHeightSlider.max, 10)));
      gridHeightSlider.value = String(clamped);
      if (gridHeightValue) gridHeightValue.textContent = String(clamped);
      gridSettings.liveResize(fullscreen.isFullscreen);
      onSaveSettings();
    });
  }

  // ─── Auto-Stop Settings ──────────────────────────────────────

  private wireAutoStopSettings(): void {
    const { dom, autoStop, onSaveSettings } = this.deps;

    // Auto-stop toggle
    const autoStopToggle = dom.get('autoStopToggle');
    autoStopToggle?.addEventListener('click', () => {
      autoStop.toggle();
      onSaveSettings();
    });

    // Auto-stop delay slider
    const autoStopDelay = dom.get<HTMLInputElement>('autoStopDelay');
    const autoStopDelayValue = dom.get('autoStopDelayValue');
    autoStopDelay?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      autoStop.setDelay(value);
      if (autoStopDelayValue) autoStopDelayValue.textContent = String(value);
      onSaveSettings();
    });

    // Auto-stop notification checkbox
    const autoStopNotification = dom.get<HTMLInputElement>('autoStopNotification');
    autoStopNotification?.addEventListener('change', (e) => {
      autoStop.setShowNotification((e.target as HTMLInputElement).checked);
      onSaveSettings();
    });
  }

  // ─── Custom Rules ────────────────────────────────────────────

  private wireCustomRules(): void {
    const { dom, customRules, onSaveSettings } = this.deps;

    // Rule presets dropdown
    const rulePresets = dom.get<HTMLSelectElement>('rulePresets');
    rulePresets?.addEventListener('change', (e) => {
      customRules.handlePresetChange((e.target as HTMLSelectElement).value);
      onSaveSettings();
    });

    // Birth and survival checkboxes
    for (let i = 0; i <= 8; i++) {
      const birthCb = document.getElementById(`birth${i}`) as HTMLInputElement | null;
      const survivalCb = document.getElementById(`survival${i}`) as HTMLInputElement | null;

      birthCb?.addEventListener('change', () => {
        customRules.updateFromCheckboxes();
        onSaveSettings();
      });

      survivalCb?.addEventListener('change', () => {
        customRules.updateFromCheckboxes();
        onSaveSettings();
      });
    }
  }

  // ─── Fullscreen Controls ─────────────────────────────────────

  private wireFullscreenControls(): void {
    const { dom, fullscreen, sim } = this.deps;

    // Enter fullscreen button
    const fullscreenBtn = dom.get('fullscreenBtn');
    fullscreenBtn?.addEventListener('click', () => fullscreen.enter());

    // Exit fullscreen button
    const exitFullscreenBtn = dom.get('exitFullscreenBtn');
    exitFullscreenBtn?.addEventListener('click', () => fullscreen.exit());

    // Listen for fullscreen changes (ESC key, F11, etc.)
    document.addEventListener('fullscreenchange', () => fullscreen.handleChange());

    // Floating fullscreen controls
    const fullscreenPlayPauseBtn = dom.get('fullscreenPlayPauseBtn');
    fullscreenPlayPauseBtn?.addEventListener('click', () => sim.toggleSimulation());

    const fullscreenShuffleBtn = dom.get('fullscreenShuffleBtn');
    fullscreenShuffleBtn?.addEventListener('click', () => sim.randomize());

    const fullscreenClearBtn = dom.get('fullscreenClearBtn');
    fullscreenClearBtn?.addEventListener('click', () => sim.clearAll());
  }

  // ─── Drawing Tools ───────────────────────────────────────────

  private wireDrawingTools(): void {
    const { dom, tools, input, onSaveSettings } = this.deps;

    // Cell drawing button
    const cellDrawingBtn = document.getElementById('cellDrawingBtn');
    cellDrawingBtn?.addEventListener('click', () => tools.selectCellMode());

    // Cell inspector button
    const cellInspectorBtn = document.getElementById('cellInspectorBtn');
    cellInspectorBtn?.addEventListener('click', () => tools.selectInspectorMode());

    // Pattern selection button
    const patternSelectBtn = document.getElementById('patternSelectBtn');
    patternSelectBtn?.addEventListener('click', () => tools.selectSelectionMode());

    // Eraser button
    const eraserBtn = document.getElementById('eraserBtn');
    eraserBtn?.addEventListener('click', () => tools.selectEraserMode());

    // Line tool button
    const lineBtn = document.getElementById('lineBtn');
    lineBtn?.addEventListener('click', () => tools.selectLineMode());

    // Rectangle tool button
    const rectangleBtn = document.getElementById('rectangleBtn');
    rectangleBtn?.addEventListener('click', () => tools.selectRectangleMode());

    // Circle tool button
    const circleBtn = document.getElementById('circleBtn');
    circleBtn?.addEventListener('click', () => tools.selectCircleMode());

    // Eraser size slider
    const eraserSize = dom.get<HTMLInputElement>('eraserSize');
    const eraserSizeValue = dom.get('eraserSizeValue');
    eraserSize?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      input.eraser.brushSize = value;
      if (eraserSizeValue) eraserSizeValue.textContent = String(value);
      onSaveSettings();
    });

    // Eraser shape selector
    const eraserShape = dom.get<HTMLSelectElement>('eraserShape');
    eraserShape?.addEventListener('change', (e) => {
      input.eraser.brushShape = (e.target as HTMLSelectElement).value as 'circle' | 'square';
      onSaveSettings();
    });
  }

  // ─── Pattern Controls ────────────────────────────────────────

  private wirePatternControls(): void {
    const { dom, patterns } = this.deps;

    // Pattern search
    const patternSearch = dom.get<HTMLInputElement>('patternSearch');
    patternSearch?.addEventListener('input', (e) => {
      patterns.handleSearch((e.target as HTMLInputElement).value);
    });

    // Clear search on ESC
    patternSearch?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        patterns.clearSearch();
      }
    });

    // Preset pattern buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const patternName = (btn as HTMLElement).dataset.pattern;
        if (patternName) {
          patterns.selectPattern(patternName);
        }
      });
    });
  }

  // ─── Canvas Events ───────────────────────────────────────────

  private wireCanvasEvents(): void {
    const { input, canvas } = this.deps;
    input.attach(canvas);
  }

  // ─── Keyboard Events ─────────────────────────────────────────

  private wireKeyboardEvents(): void {
    const { tools, fullscreen, sim, bus, input } = this.deps;

    document.addEventListener('keydown', (e) => {
      // Handle ESC key for fullscreen exit
      if (e.key === 'Escape' && fullscreen.isFullscreen) {
        e.preventDefault();
        fullscreen.exit();
        return;
      }

      // Handle pattern rotation
      if (!sim.isRunning && tools.selectedPattern) {
        if (e.key === '[') {
          e.preventDefault();
          tools.patternRotation = (tools.patternRotation - 90 + 360) % 360;
          input.refreshPatternPreview();
          bus.emit('canvas:needsRedraw');
        } else if (e.key === ']') {
          e.preventDefault();
          tools.patternRotation = (tools.patternRotation + 90) % 360;
          input.refreshPatternPreview();
          bus.emit('canvas:needsRedraw');
        }
      }
    });
  }

  // ─── Save Pattern Modal ──────────────────────────────────────

  private wireSavePatternModal(): void {
    const { dom, selection, input } = this.deps;

    const patternModalClose = dom.get('patternModalClose');
    patternModalClose?.addEventListener('click', () => {
      selection.closeModal();
      input.clearSelection();
    });

    const cancelPatternSave = dom.get('cancelPatternSave');
    cancelPatternSave?.addEventListener('click', () => {
      selection.closeModal();
      input.clearSelection();
    });

    const confirmPatternSave = dom.get('confirmPatternSave');
    confirmPatternSave?.addEventListener('click', () => {
      selection.savePattern();
      input.clearSelection();
    });

    // Close modal when clicking outside
    const savePatternModal = dom.get('savePatternModal');
    savePatternModal?.addEventListener('click', (e) => {
      if (e.target === savePatternModal) {
        selection.closeModal();
        input.clearSelection();
      }
    });
  }

  // ─── Max Toggle Buttons ──────────────────────────────────────

  private wireMaxToggleButtons(): void {
    document.querySelectorAll('.max-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const button = btn as HTMLElement;
        const targetId = button.dataset.target;
        if (!targetId) return;

        const maxInput = document.getElementById(targetId);
        if (!maxInput) return;

        // Toggle visibility
        const isVisible = maxInput.classList.toggle('visible');
        button.classList.toggle('active', isVisible);

        // Focus input when shown
        if (isVisible) {
          (maxInput as HTMLInputElement).focus();
          (maxInput as HTMLInputElement).select();
        }
      });
    });

    // Hide max input when clicking outside or pressing Escape
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.slider-label-row')) {
        document.querySelectorAll('.max-input.visible').forEach(input => {
          input.classList.remove('visible');
          const btn = input.previousElementSibling;
          if (btn?.classList.contains('max-toggle-btn')) {
            btn.classList.remove('active');
          }
        });
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.max-input.visible').forEach(input => {
          input.classList.remove('visible');
          const btn = input.previousElementSibling;
          if (btn?.classList.contains('max-toggle-btn')) {
            btn.classList.remove('active');
          }
        });
      }
    });
  }

  // ─── Utility ─────────────────────────────────────────────────

  private updateSliderMax(slider: HTMLInputElement | null, maxValue: string): void {
    if (!slider) return;
    const newMax = parseInt(maxValue);
    const currentValue = parseInt(slider.value);

    if (newMax >= currentValue && newMax > parseInt(slider.min)) {
      slider.max = String(newMax);
    } else if (newMax < currentValue) {
      slider.max = String(newMax);
      slider.value = String(newMax);
      slider.dispatchEvent(new Event('input'));
    }
  }

  // ─── Settings Export/Import ─────────────────────────────────

  private wireSettingsExportImport(): void {
    const { dom, persistence } = this.deps;

    const exportBtn = dom.get('exportSettingsBtn');
    exportBtn?.addEventListener('click', () => persistence.exportToFile());

    const importBtn = dom.get('importSettingsBtn');
    importBtn?.addEventListener('click', () => persistence.importFromFile());

    const resetBtn = dom.get('resetDefaultsBtn');
    resetBtn?.addEventListener('click', () => {
      if (confirm('Reset all settings to defaults? This cannot be undone.')) {
        persistence.resetToDefaults();
      }
    });
  }
}
