import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventWiring, EventWiringDeps } from '../../modules/event-wiring';
import { EventBus } from '../../core/event-bus';
import { DomRegistry } from '../../core/dom-registry';

// Mock lucide globally
(globalThis as any).lucide = { createIcons: vi.fn() };

function createMockSimulationController() {
  return {
    toggleSimulation: vi.fn(),
    reset: vi.fn(),
    clearAll: vi.fn(),
    randomize: vi.fn(),
    setSpeed: vi.fn(),
    randomDensity: 30,
    randomSeed: null,
    generateRandomSeed: vi.fn(),
    fillEdges: vi.fn(),
    fillCenter: vi.fn(),
    invertAll: vi.fn(),
    isRunning: false,
  };
}

function createMockGridSettings() {
  return {
    liveResize: vi.fn(),
    apply: vi.fn(),
  };
}

function createMockVisualSettings() {
  return {
    togglePixelGrid: vi.fn(),
    toggleGrid: vi.fn(),
    toggleFadeMode: vi.fn(),
    setFadeDuration: vi.fn(),
    toggleMaturityMode: vi.fn(),
    setMaturityColor: vi.fn(),
    toggleCellShape: vi.fn(),
  };
}

function createMockAutoStop() {
  return {
    toggle: vi.fn(),
    setDelay: vi.fn(),
    setShowNotification: vi.fn(),
  };
}

function createMockFullscreen() {
  return {
    enter: vi.fn(),
    exit: vi.fn(),
    handleChange: vi.fn(),
    isFullscreen: false,
  };
}

function createMockSidebar() {
  return {
    toggle: vi.fn(),
    switchTab: vi.fn(),
    openMobile: vi.fn(),
    closeMobile: vi.fn(),
  };
}

function createMockTheme() {
  return {
    toggle: vi.fn(),
  };
}

function createMockDrawingTools() {
  return {
    selectCellMode: vi.fn(),
    selectInspectorMode: vi.fn(),
    selectSelectionMode: vi.fn(),
    selectEraserMode: vi.fn(),
    selectedPattern: null,
    patternRotation: 0,
  };
}

function createMockInputHandler() {
  return {
    attach: vi.fn(),
    eraser: {
      brushSize: 1,
      brushShape: 'circle' as const,
    },
  };
}

function createMockCustomRules() {
  return {
    handlePresetChange: vi.fn(),
    updateFromCheckboxes: vi.fn(),
  };
}

function createMockPatternManager() {
  return {
    handleSearch: vi.fn(),
    clearSearch: vi.fn(),
    selectPattern: vi.fn(),
  };
}

function createMockSelectionManager() {
  return {
    closeModal: vi.fn(),
    savePattern: vi.fn(),
  };
}

function createMockEngine() {
  return {
    grid: [[false]],
    generation: 0,
    resize: vi.fn(),
    setCell: vi.fn(),
    getGridSnapshot: vi.fn(() => ({ grid: [[false]], generation: 0 })),
  };
}

function setupDOM() {
  document.body.innerHTML = `
    <!-- Simulation Controls -->
    <button id="startStopBtn"></button>
    <button id="resetBtn"></button>
    <button id="clearBtn"></button>
    <button id="randomBtn"></button>
    <input id="speedSlider" type="range" min="1" max="20" value="10" />
    <span id="speedValue">10</span>
    <input id="speedMax" type="number" value="20" />
    <input id="randomDensitySlider" type="range" min="5" max="80" value="30" />
    <span id="randomDensityValue">30%</span>
    <input id="randomDensityMax" type="number" value="80" />
    <button id="generateSeedBtn"></button>
    <input id="randomSeedInput" type="number" value="" />
    <button id="fillRandomBtn"></button>
    <button id="fillEdgesBtn"></button>
    <button id="fillCenterBtn"></button>
    <button id="invertBtn"></button>

    <!-- Sidebar -->
    <button id="sidebarToggle"></button>
    <button class="sidebar-nav-btn" data-tab="controls"></button>
    <button class="sidebar-nav-btn" data-tab="tools"></button>
    <button id="mobileMenuBtn"></button>
    <div id="sidebarOverlay"></div>
    <button id="darkModeToggle"></button>

    <!-- Visual Toggles -->
    <button id="pixelGridToggle"></button>
    <button id="gridToggle"></button>
    <button id="fadeToggle"></button>
    <input id="fadeSlider" type="range" min="1" max="10" value="1" />
    <span id="fadeValue">1</span>
    <input id="fadeMax" type="number" value="10" />
    <button id="maturityToggle"></button>
    <input id="maturityColor" type="color" value="#4c1d95" />
    <button id="cellShapeToggle"></button>

    <!-- Grid Settings -->
    <input id="gridWidthSlider" type="range" min="30" max="120" value="60" />
    <span id="gridWidthValue">60</span>
    <input id="gridWidthMax" type="number" value="120" />
    <input id="gridHeightSlider" type="range" min="20" max="80" value="40" />
    <span id="gridHeightValue">40</span>
    <input id="gridHeightMax" type="number" value="80" />
    <input id="cellSizeSlider" type="range" min="3" max="20" value="10" />
    <span id="cellSizeValue">10px</span>
    <input id="cellSizeMax" type="number" value="20" />

    <!-- Auto-Stop -->
    <button id="autoStopToggle"></button>
    <input id="autoStopDelay" type="range" min="2" max="10" value="3" />
    <span id="autoStopDelayValue">3</span>
    <input id="autoStopNotification" type="checkbox" checked />

    <!-- Custom Rules -->
    <select id="rulePresets"><option value="B3/S23">Conway's Life</option></select>
    <input type="checkbox" id="birth0" value="0" />
    <input type="checkbox" id="birth3" value="3" checked />
    <input type="checkbox" id="survival2" value="2" checked />
    <input type="checkbox" id="survival3" value="3" checked />

    <!-- Fullscreen -->
    <button id="fullscreenBtn"></button>
    <button id="exitFullscreenBtn"></button>
    <button id="fullscreenPlayPauseBtn"></button>
    <button id="fullscreenShuffleBtn"></button>
    <button id="fullscreenClearBtn"></button>

    <!-- Drawing Tools -->
    <button id="cellDrawingBtn"></button>
    <button id="cellInspectorBtn"></button>
    <button id="patternSelectBtn"></button>
    <button id="eraserBtn"></button>
    <input id="eraserSize" type="range" min="1" max="10" value="1" />
    <span id="eraserSizeValue">1</span>
    <select id="eraserShape"><option value="circle">Circle</option><option value="square">Square</option></select>

    <!-- Pattern Controls -->
    <input id="patternSearch" type="text" />
    <button class="preset-btn" data-pattern="glider"></button>

    <!-- Save Pattern Modal -->
    <button id="patternModalClose"></button>
    <button id="cancelPatternSave"></button>
    <button id="confirmPatternSave"></button>
    <div id="savePatternModal"></div>

    <!-- Canvas -->
    <canvas id="gameCanvas" width="600" height="400"></canvas>
  `;
}

function createDeps(): EventWiringDeps {
  const bus = new EventBus();
  const dom = new DomRegistry();
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

  return {
    bus,
    dom,
    sim: createMockSimulationController() as any,
    sidebar: createMockSidebar() as any,
    theme: createMockTheme() as any,
    visual: createMockVisualSettings() as any,
    tools: createMockDrawingTools() as any,
    gridSettings: createMockGridSettings() as any,
    autoStop: createMockAutoStop() as any,
    customRules: createMockCustomRules() as any,
    fullscreen: createMockFullscreen() as any,
    patterns: createMockPatternManager() as any,
    selection: createMockSelectionManager() as any,
    input: createMockInputHandler() as any,
    canvas,
    engine: createMockEngine() as any,
    patternsLib: {} as any,
    onSaveSettings: vi.fn(),
  };
}

describe('EventWiring', () => {
  beforeEach(() => {
    setupDOM();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('wireSimulationControls', () => {
    it('wires start/stop button to toggleSimulation', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('startStopBtn')?.click();
      expect(deps.sim.toggleSimulation).toHaveBeenCalled();
    });

    it('wires reset button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('resetBtn')?.click();
      expect(deps.sim.reset).toHaveBeenCalled();
    });

    it('wires clear button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('clearBtn')?.click();
      expect(deps.sim.clearAll).toHaveBeenCalled();
    });

    it('wires random button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('randomBtn')?.click();
      expect(deps.sim.randomize).toHaveBeenCalled();
    });

    it('wires speed slider', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const slider = document.getElementById('speedSlider') as HTMLInputElement;
      slider.value = '15';
      slider.dispatchEvent(new Event('input'));

      expect(deps.sim.setSpeed).toHaveBeenCalledWith(15);
      expect(document.getElementById('speedValue')?.textContent).toBe('15');
      expect(deps.onSaveSettings).toHaveBeenCalled();
    });

    it('wires random density slider', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const slider = document.getElementById('randomDensitySlider') as HTMLInputElement;
      slider.value = '50';
      slider.dispatchEvent(new Event('input'));

      expect(deps.sim.randomDensity).toBe(50);
      expect(document.getElementById('randomDensityValue')?.textContent).toBe('50%');
      expect(deps.onSaveSettings).toHaveBeenCalled();
    });

    it('wires generate seed button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('generateSeedBtn')?.click();
      expect(deps.sim.generateRandomSeed).toHaveBeenCalled();
    });

    it('wires random seed input', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const input = document.getElementById('randomSeedInput') as HTMLInputElement;
      input.value = '12345';
      input.dispatchEvent(new Event('input'));

      expect(deps.sim.randomSeed).toBe(12345);
      expect(deps.onSaveSettings).toHaveBeenCalled();
    });

    it('wires fill edges button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('fillEdgesBtn')?.click();
      expect(deps.sim.fillEdges).toHaveBeenCalled();
    });

    it('wires fill center button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('fillCenterBtn')?.click();
      expect(deps.sim.fillCenter).toHaveBeenCalled();
    });

    it('wires invert button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('invertBtn')?.click();
      expect(deps.sim.invertAll).toHaveBeenCalled();
    });
  });

  describe('wireGridSettings', () => {
    it('wires grid width slider and calls liveResize', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const slider = document.getElementById('gridWidthSlider') as HTMLInputElement;
      slider.value = '80';
      slider.dispatchEvent(new Event('input'));

      expect(document.getElementById('gridWidthValue')?.textContent).toBe('80');
      expect(deps.gridSettings.liveResize).toHaveBeenCalledWith(false);
      expect(deps.onSaveSettings).toHaveBeenCalled();
    });

    it('wires grid height slider and calls liveResize', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const slider = document.getElementById('gridHeightSlider') as HTMLInputElement;
      slider.value = '50';
      slider.dispatchEvent(new Event('input'));

      expect(document.getElementById('gridHeightValue')?.textContent).toBe('50');
      expect(deps.gridSettings.liveResize).toHaveBeenCalledWith(false);
      expect(deps.onSaveSettings).toHaveBeenCalled();
    });

    it('wires cell size slider and calls liveResize', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const slider = document.getElementById('cellSizeSlider') as HTMLInputElement;
      slider.value = '15';
      slider.dispatchEvent(new Event('input'));

      expect(document.getElementById('cellSizeValue')?.textContent).toBe('15px');
      expect(deps.gridSettings.liveResize).toHaveBeenCalledWith(false);
      expect(deps.onSaveSettings).toHaveBeenCalled();
    });

    it('wires grid width max input and updates slider max', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const maxInput = document.getElementById('gridWidthMax') as HTMLInputElement;
      const slider = document.getElementById('gridWidthSlider') as HTMLInputElement;

      maxInput.value = '200';
      maxInput.dispatchEvent(new Event('input'));

      expect(slider.max).toBe('200');
      expect(deps.onSaveSettings).toHaveBeenCalled();
    });
  });

  describe('wireSidebarControls', () => {
    it('wires sidebar toggle', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('sidebarToggle')?.click();
      expect(deps.sidebar.toggle).toHaveBeenCalled();
      expect(deps.onSaveSettings).toHaveBeenCalled();
    });

    it('wires tab navigation', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const tabBtn = document.querySelector('.sidebar-nav-btn[data-tab="tools"]') as HTMLElement;
      tabBtn?.click();
      expect(deps.sidebar.switchTab).toHaveBeenCalledWith('tools');
    });

    it('wires mobile menu button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('mobileMenuBtn')?.click();
      expect(deps.sidebar.openMobile).toHaveBeenCalled();
    });

    it('wires sidebar overlay for mobile close', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('sidebarOverlay')?.click();
      expect(deps.sidebar.closeMobile).toHaveBeenCalled();
    });

    it('wires dark mode toggle', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('darkModeToggle')?.click();
      expect(deps.theme.toggle).toHaveBeenCalled();
    });
  });

  describe('wireVisualToggles', () => {
    it('wires pixel grid toggle', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('pixelGridToggle')?.click();
      expect(deps.visual.togglePixelGrid).toHaveBeenCalled();
      expect(deps.onSaveSettings).toHaveBeenCalled();
    });

    it('wires grid toggle', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('gridToggle')?.click();
      expect(deps.visual.toggleGrid).toHaveBeenCalled();
    });

    it('wires fade toggle', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('fadeToggle')?.click();
      expect(deps.visual.toggleFadeMode).toHaveBeenCalledWith(deps.engine);
    });

    it('wires fade slider', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const slider = document.getElementById('fadeSlider') as HTMLInputElement;
      slider.value = '5';
      slider.dispatchEvent(new Event('input'));

      expect(deps.visual.setFadeDuration).toHaveBeenCalledWith(5);
      expect(document.getElementById('fadeValue')?.textContent).toBe('5');
    });

    it('wires maturity toggle', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('maturityToggle')?.click();
      expect(deps.visual.toggleMaturityMode).toHaveBeenCalledWith(deps.engine);
    });

    it('wires maturity color picker', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const picker = document.getElementById('maturityColor') as HTMLInputElement;
      picker.value = '#ff0000';
      picker.dispatchEvent(new Event('input'));

      expect(deps.visual.setMaturityColor).toHaveBeenCalledWith('#ff0000');
    });

    it('wires cell shape toggle', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('cellShapeToggle')?.click();
      expect(deps.visual.toggleCellShape).toHaveBeenCalled();
    });
  });

  describe('wireAutoStopSettings', () => {
    it('wires auto-stop toggle', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('autoStopToggle')?.click();
      expect(deps.autoStop.toggle).toHaveBeenCalled();
      expect(deps.onSaveSettings).toHaveBeenCalled();
    });

    it('wires auto-stop delay slider', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const slider = document.getElementById('autoStopDelay') as HTMLInputElement;
      slider.value = '7';
      slider.dispatchEvent(new Event('input'));

      expect(deps.autoStop.setDelay).toHaveBeenCalledWith(7);
      expect(document.getElementById('autoStopDelayValue')?.textContent).toBe('7');
    });

    it('wires auto-stop notification checkbox', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const checkbox = document.getElementById('autoStopNotification') as HTMLInputElement;
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change'));

      expect(deps.autoStop.setShowNotification).toHaveBeenCalledWith(false);
    });
  });

  describe('wireCustomRules', () => {
    it('wires rule presets dropdown', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const select = document.getElementById('rulePresets') as HTMLSelectElement;
      select.value = 'B3/S23';
      select.dispatchEvent(new Event('change'));

      expect(deps.customRules.handlePresetChange).toHaveBeenCalledWith('B3/S23');
      expect(deps.onSaveSettings).toHaveBeenCalled();
    });

    it('wires birth checkboxes', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const checkbox = document.getElementById('birth3') as HTMLInputElement;
      checkbox.dispatchEvent(new Event('change'));

      expect(deps.customRules.updateFromCheckboxes).toHaveBeenCalled();
    });
  });

  describe('wireFullscreenControls', () => {
    it('wires fullscreen button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('fullscreenBtn')?.click();
      expect(deps.fullscreen.enter).toHaveBeenCalled();
    });

    it('wires exit fullscreen button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('exitFullscreenBtn')?.click();
      expect(deps.fullscreen.exit).toHaveBeenCalled();
    });

    it('wires fullscreen play/pause button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('fullscreenPlayPauseBtn')?.click();
      expect(deps.sim.toggleSimulation).toHaveBeenCalled();
    });

    it('wires fullscreen shuffle button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('fullscreenShuffleBtn')?.click();
      expect(deps.sim.randomize).toHaveBeenCalled();
    });

    it('wires fullscreen clear button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('fullscreenClearBtn')?.click();
      expect(deps.sim.clearAll).toHaveBeenCalled();
    });
  });

  describe('wireDrawingTools', () => {
    it('wires cell drawing button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('cellDrawingBtn')?.click();
      expect(deps.tools.selectCellMode).toHaveBeenCalled();
    });

    it('wires cell inspector button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('cellInspectorBtn')?.click();
      expect(deps.tools.selectInspectorMode).toHaveBeenCalled();
    });

    it('wires pattern select button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('patternSelectBtn')?.click();
      expect(deps.tools.selectSelectionMode).toHaveBeenCalled();
    });

    it('wires eraser button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('eraserBtn')?.click();
      expect(deps.tools.selectEraserMode).toHaveBeenCalled();
    });

    it('wires eraser size slider', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const slider = document.getElementById('eraserSize') as HTMLInputElement;
      slider.value = '5';
      slider.dispatchEvent(new Event('input'));

      expect(deps.input.eraser.brushSize).toBe(5);
      expect(document.getElementById('eraserSizeValue')?.textContent).toBe('5');
    });

    it('wires eraser shape selector', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const select = document.getElementById('eraserShape') as HTMLSelectElement;
      select.value = 'square';
      select.dispatchEvent(new Event('change'));

      expect(deps.input.eraser.brushShape).toBe('square');
    });
  });

  describe('wirePatternControls', () => {
    it('wires pattern search input', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const input = document.getElementById('patternSearch') as HTMLInputElement;
      input.value = 'glider';
      input.dispatchEvent(new Event('input'));

      expect(deps.patterns.handleSearch).toHaveBeenCalledWith('glider');
    });

    it('wires pattern search ESC to clear', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const input = document.getElementById('patternSearch') as HTMLInputElement;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(deps.patterns.clearSearch).toHaveBeenCalled();
    });

    it('wires preset pattern buttons', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const btn = document.querySelector('.preset-btn[data-pattern="glider"]') as HTMLElement;
      btn?.click();

      expect(deps.patterns.selectPattern).toHaveBeenCalledWith('glider');
    });
  });

  describe('wireCanvasEvents', () => {
    it('attaches input handler to canvas', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      expect(deps.input.attach).toHaveBeenCalledWith(deps.canvas);
    });
  });

  describe('wireSavePatternModal', () => {
    it('wires modal close button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('patternModalClose')?.click();
      expect(deps.selection.closeModal).toHaveBeenCalled();
    });

    it('wires cancel button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('cancelPatternSave')?.click();
      expect(deps.selection.closeModal).toHaveBeenCalled();
    });

    it('wires confirm save button', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      document.getElementById('confirmPatternSave')?.click();
      expect(deps.selection.savePattern).toHaveBeenCalled();
    });
  });

  describe('updateSliderMax utility', () => {
    it('updates slider max when new max is valid', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const slider = document.getElementById('gridWidthSlider') as HTMLInputElement;
      const maxInput = document.getElementById('gridWidthMax') as HTMLInputElement;

      slider.value = '60';
      maxInput.value = '200';
      maxInput.dispatchEvent(new Event('input'));

      expect(slider.max).toBe('200');
    });

    it('clamps slider value when new max is below current value', () => {
      const deps = createDeps();
      const wiring = new EventWiring(deps);
      wiring.setupAll();

      const slider = document.getElementById('gridWidthSlider') as HTMLInputElement;
      const maxInput = document.getElementById('gridWidthMax') as HTMLInputElement;

      slider.value = '100';
      maxInput.value = '50';
      maxInput.dispatchEvent(new Event('input'));

      expect(slider.max).toBe('50');
      expect(slider.value).toBe('50');
    });
  });
});
