/**
 * Default settings used when no user settings exist in localStorage.
 */

import type { SettingsSnapshot } from '../modules/settings-persistence';

export const DEFAULT_GRID_SETTINGS = {
  rows: 50,
  cols: 80,
  cellSize: 10,
};

export const DEFAULT_VISUAL_SETTINGS = {
  showGrid: true,
  showPixelGrid: false,
  showFade: true,
  showMaturity: false,
  fadeDuration: 500,
  maturityColor: '#00ff00',
  cellShape: 'square',
};

export const DEFAULT_AUTO_STOP = {
  enabled: false,
  delaySetting: 5,
  showNotification: true,
};

export const DEFAULT_CUSTOM_RULES = {
  ruleString: 'B3/S23',
};

export const DEFAULT_DRAWING_TOOLS = {
  mode: 'cell' as const,
  selectedPattern: null,
  rotation: 0,
};

export const DEFAULT_SIMULATION = {
  speed: 10,
  randomDensity: 30,
};

export const DEFAULT_SLIDER_MAXES = {
  speedMax: '60',
  gridWidthMax: '200',
  gridHeightMax: '200',
  cellSizeMax: '50',
  randomDensityMax: '100',
};

export function getDefaultSettings(): SettingsSnapshot {
  return {
    gridSettings: { ...DEFAULT_GRID_SETTINGS },
    visualSettings: { ...DEFAULT_VISUAL_SETTINGS },
    autoStop: { ...DEFAULT_AUTO_STOP },
    customRules: { ...DEFAULT_CUSTOM_RULES },
    drawingTools: { ...DEFAULT_DRAWING_TOOLS },
    speed: DEFAULT_SIMULATION.speed,
    randomDensity: DEFAULT_SIMULATION.randomDensity,
    sliderMaxes: { ...DEFAULT_SLIDER_MAXES },
    sidebarCollapsed: false,
    activeTab: 'tab-tools',
  };
}
