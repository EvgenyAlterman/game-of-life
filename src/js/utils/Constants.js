/**
 * Application Constants
 * Central location for all configuration values and defaults
 */

export const DEFAULTS = {
    // Grid settings
    CELL_SIZE: 10,
    GRID_WIDTH: 60,
    GRID_HEIGHT: 40,
    
    // Animation settings
    SPEED: 5, // Updates per second
    MAX_SPEED: 20,
    
    // Visual settings
    FADE_DURATION: 1,
    MAX_FADE_DURATION: 10,
    MATURITY_END_COLOR: '#4c1d95', // Deep violet
    
    // Random generation
    RANDOM_DENSITY: 30, // Percentage
    
    // UI settings
    SIDEBAR_COLLAPSED: false,
    THEME: 'system' // 'light', 'dark', 'system'
};

export const COLORS = {
    // Cell colors (will be overridden by CSS variables)
    ALIVE_CELL: '#4A90E2',
    DEAD_CELL: '#FFFFFF',
    GRID_LINE: '#E0E0E0',
    PREVIEW: '#4A90E280',
    MATURITY_START: { r: 144, g: 205, b: 244 } // Light blue
};

export const STORAGE_KEYS = {
    GAME_SETTINGS: 'gameOfLifeSettings',
    RECORDINGS: 'gameOfLifeRecordings'
};

export const KEYBOARD = {
    ROTATE_LEFT: '[',
    ROTATE_RIGHT: ']',
    ESCAPE: 'Escape',
    SPACE: ' ',
    ENTER: 'Enter',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight'
};

export const EVENTS = {
    // Game events
    GAME_START: 'game:start',
    GAME_STOP: 'game:stop',
    GAME_RESET: 'game:reset',
    GAME_CLEAR: 'game:clear',
    GENERATION_UPDATE: 'game:generation',
    
    // Grid events
    GRID_RESIZE: 'grid:resize',
    GRID_CLEAR: 'grid:clear',
    CELL_TOGGLE: 'cell:toggle',
    
    // Pattern events
    PATTERN_SELECT: 'pattern:select',
    PATTERN_PLACE: 'pattern:place',
    PATTERN_ROTATE: 'pattern:rotate',
    
    // Visual effects events
    FADE_TOGGLE: 'fade:toggle',
    FADE_DURATION_CHANGE: 'fade:duration:change',
    MATURITY_TOGGLE: 'maturity:toggle',
    MATURITY_COLOR_CHANGE: 'maturity:color:change',
    GRID_OVERLAY_TOGGLE: 'grid:overlay:toggle',
    
    // Drawing events
    DRAWING_MODE_CHANGE: 'drawing:mode:change',
    INSPECTOR_TOGGLE: 'inspector:toggle',
    
    // UI events
    SIDEBAR_TOGGLE: 'ui:sidebar:toggle',
    THEME_CHANGE: 'ui:theme:change',
    
    // Recording events
    RECORDING_START: 'recording:start',
    RECORDING_STOP: 'recording:stop',
    RECORDING_SAVE: 'recording:save'
};

export const ANIMATION = {
    TRANSITION_DURATION: 300, // ms
    EASING: 'cubic-bezier(0.4, 0, 0.2, 1)'
};

export const DRAWING_MODES = {
    CELL: 'cell',
    PATTERN: 'pattern',
    INSPECTOR: 'inspector'
};
