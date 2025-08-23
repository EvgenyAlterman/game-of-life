/**
 * Fade/Ghost Trail System
 * Tracks and renders fading cells that recently died
 */

import { eventBus } from '../utils/EventEmitter.js';
import { EVENTS, DEFAULTS } from '../utils/Constants.js';

export class FadeSystem {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.isActive = false;
        this.duration = DEFAULTS.FADE_DURATION;
        this.fadeGrid = [];
        
        this.initializeGrid();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        eventBus.on(EVENTS.FADE_TOGGLE, () => this.toggle());
        eventBus.on(EVENTS.FADE_DURATION_CHANGE, (duration) => this.setDuration(duration));
        eventBus.on(EVENTS.GRID_RESIZE, ({rows, cols}) => this.resize(rows, cols));
        eventBus.on(EVENTS.GRID_CLEAR, () => this.clearGrid());
        eventBus.on(EVENTS.GENERATION_UPDATE, (data) => this.update(data.oldGrid, data.newGrid));
    }
    
    initializeGrid() {
        this.fadeGrid = [];
        
        for (let row = 0; row < this.rows; row++) {
            this.fadeGrid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.fadeGrid[row][col] = 0; // 0 = no fade, > 0 = fade level
            }
        }
    }
    
    resize(newRows, newCols) {
        // Preserve existing data when resizing
        const oldFadeGrid = [...this.fadeGrid];
        
        this.rows = newRows;
        this.cols = newCols;
        this.initializeGrid();
        
        // Copy old data to new grid
        const copyRows = Math.min(oldFadeGrid.length, newRows);
        const copyCols = Math.min(oldFadeGrid[0]?.length || 0, newCols);
        
        for (let row = 0; row < copyRows; row++) {
            for (let col = 0; col < copyCols; col++) {
                if (oldFadeGrid[row]) {
                    this.fadeGrid[row][col] = oldFadeGrid[row][col] || 0;
                }
            }
        }
    }
    
    toggle() {
        this.isActive = !this.isActive;
        
        if (!this.isActive) {
            this.clearGrid();
        }
        
        eventBus.emit('fade:state:changed', this.isActive);
    }
    
    setActive(active) {
        this.isActive = active;
        if (!active) {
            this.clearGrid();
        }
    }
    
    setDuration(duration) {
        this.duration = Math.max(1, Math.min(duration, DEFAULTS.MAX_FADE_DURATION));
        eventBus.emit('fade:duration:changed', this.duration);
    }
    
    update(oldGrid, newGrid) {
        if (!this.isActive) return;
        
        // First, decrease all existing fade levels
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.fadeGrid[row][col] > 0) {
                    this.fadeGrid[row][col]--;
                }
            }
        }
        
        // Then, set fade level for cells that just died
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const wasAlive = oldGrid[row][col];
                const isAlive = newGrid[row][col];
                
                if (wasAlive && !isAlive) {
                    // Cell just died - start fade effect
                    this.fadeGrid[row][col] = this.duration;
                } else if (isAlive) {
                    // Cell is alive - no fade
                    this.fadeGrid[row][col] = 0;
                }
            }
        }
    }
    
    clearGrid() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.fadeGrid[row][col] = 0;
            }
        }
    }
    
    getFadeGrid() {
        return this.fadeGrid;
    }
    
    // Settings for persistence
    getSettings() {
        return {
            isActive: this.isActive,
            duration: this.duration
        };
    }
    
    applySettings(settings) {
        if (settings.isActive !== undefined) {
            this.setActive(settings.isActive);
        }
        
        if (settings.duration !== undefined) {
            this.setDuration(settings.duration);
        }
    }
}
