/**
 * Cell Maturity System
 * Tracks cell age and provides maturity-based visualization
 */

import { eventBus } from '../utils/EventEmitter.js';
import { ColorUtils } from '../utils/ColorUtils.js';
import { EVENTS, COLORS, DEFAULTS } from '../utils/Constants.js';

export class MaturitySystem {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.isActive = false;
        this.endColor = DEFAULTS.MATURITY_END_COLOR;
        this.maturityGrid = [];
        this.deadGrid = [];
        
        this.initializeGrids();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        eventBus.on(EVENTS.MATURITY_TOGGLE, () => this.toggle());
        eventBus.on(EVENTS.MATURITY_COLOR_CHANGE, (color) => this.setEndColor(color));
        eventBus.on(EVENTS.GRID_RESIZE, ({rows, cols}) => this.resize(rows, cols));
        eventBus.on(EVENTS.GRID_CLEAR, () => this.clearGrids());
        eventBus.on(EVENTS.GENERATION_UPDATE, (data) => this.update(data.oldGrid, data.newGrid));
    }
    
    initializeGrids() {
        this.maturityGrid = [];
        this.deadGrid = [];
        
        for (let row = 0; row < this.rows; row++) {
            this.maturityGrid[row] = [];
            this.deadGrid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.maturityGrid[row][col] = 0;
                this.deadGrid[row][col] = 0;
            }
        }
    }
    
    resize(newRows, newCols) {
        // Preserve existing data when resizing
        const oldMaturity = [...this.maturityGrid];
        const oldDead = [...this.deadGrid];
        
        this.rows = newRows;
        this.cols = newCols;
        this.initializeGrids();
        
        // Copy old data to new grids
        const copyRows = Math.min(oldMaturity.length, newRows);
        const copyCols = Math.min(oldMaturity[0]?.length || 0, newCols);
        
        for (let row = 0; row < copyRows; row++) {
            for (let col = 0; col < copyCols; col++) {
                if (oldMaturity[row] && oldDead[row]) {
                    this.maturityGrid[row][col] = oldMaturity[row][col] || 0;
                    this.deadGrid[row][col] = oldDead[row][col] || 0;
                }
            }
        }
    }
    
    toggle() {
        this.isActive = !this.isActive;
        
        if (!this.isActive) {
            this.clearGrids();
        }
        
        eventBus.emit('maturity:state:changed', this.isActive);
    }
    
    setActive(active) {
        this.isActive = active;
        if (!active) {
            this.clearGrids();
        }
    }
    
    setEndColor(color) {
        this.endColor = color;
        eventBus.emit('maturity:color:changed', color);
    }
    
    update(oldGrid, newGrid) {
        if (!this.isActive) return;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const wasAlive = oldGrid[row][col];
                const isAlive = newGrid[row][col];
                
                if (isAlive) {
                    if (wasAlive) {
                        // Cell survived - increase maturity
                        this.maturityGrid[row][col]++;
                    } else {
                        // Cell was just born - start at 0
                        this.maturityGrid[row][col] = 0;
                    }
                    // Cell is alive - reset dead time
                    this.deadGrid[row][col] = 0;
                } else {
                    // Cell is dead
                    this.maturityGrid[row][col] = 0;
                    if (wasAlive) {
                        // Cell just died - start dead counter at 0
                        this.deadGrid[row][col] = 0;
                    } else {
                        // Cell has been dead - increase dead time
                        this.deadGrid[row][col]++;
                    }
                }
            }
        }
    }
    
    getMaturityColor(maturity) {
        // Cap maturity at 20 for color calculation
        const cappedMaturity = Math.min(maturity, 20);
        const intensity = cappedMaturity / 20;
        
        // Create gradient from light blue to end color
        return ColorUtils.interpolateColor(
            COLORS.MATURITY_START, // Light blue
            ColorUtils.hexToRgb(this.endColor),
            intensity
        );
    }
    
    getMaturity(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.maturityGrid[row][col];
        }
        return 0;
    }
    
    getDeadTime(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.deadGrid[row][col];
        }
        return 0;
    }
    
    clearGrids() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.maturityGrid[row][col] = 0;
                this.deadGrid[row][col] = 0;
            }
        }
    }
    
    getCellsForRendering(grid) {
        if (!this.isActive) return [];
        
        const matureCells = [];
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const isAlive = grid[row][col];
                const maturity = this.maturityGrid[row][col];
                
                if (isAlive && maturity > 0) {
                    matureCells.push({
                        row,
                        col,
                        maturity,
                        color: this.getMaturityColor(maturity)
                    });
                }
            }
        }
        
        return matureCells;
    }
    
    // Settings for persistence
    getSettings() {
        return {
            isActive: this.isActive,
            endColor: this.endColor
        };
    }
    
    applySettings(settings) {
        if (settings.isActive !== undefined) {
            this.setActive(settings.isActive);
        }
        
        if (settings.endColor !== undefined) {
            this.setEndColor(settings.endColor);
        }
    }
}
