/**
 * Cell Inspector System
 * Handles cell hover inspection and tooltip display
 */

import { eventBus } from '../utils/EventEmitter.js';
import { EVENTS } from '../utils/Constants.js';

export class CellInspector {
    constructor(canvas) {
        this.canvas = canvas;
        this.isActive = false;
        this.tooltip = null;
        this.gameEngine = null;
        this.maturitySystem = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        eventBus.on(EVENTS.INSPECTOR_TOGGLE, () => this.toggle());
        eventBus.on('inspector:activate', () => this.activate());
        eventBus.on('inspector:deactivate', () => this.deactivate());
    }
    
    setDependencies(gameEngine, maturitySystem) {
        this.gameEngine = gameEngine;
        this.maturitySystem = maturitySystem;
    }
    
    activate() {
        this.isActive = true;
        this.canvas.style.cursor = 'help';
        this.createTooltip();
        eventBus.emit(EVENTS.DRAWING_MODE_CHANGE, 'inspector');
        eventBus.emit('inspector:state:changed', true);
    }
    
    deactivate() {
        this.isActive = false;
        this.canvas.style.cursor = 'default';
        this.removeTooltip();
        eventBus.emit('inspector:state:changed', false);
    }
    
    toggle() {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }
    
    handleMouseMove(row, col, clientX, clientY, cellSize) {
        if (!this.isActive || !this.tooltip || !this.gameEngine) return;
        
        if (row >= 0 && row < this.gameEngine.rows && col >= 0 && col < this.gameEngine.cols) {
            const cellInfo = this.getCellInfo(row, col);
            this.showTooltip(cellInfo, clientX, clientY);
        } else {
            this.hideTooltip();
        }
    }
    
    getCellInfo(row, col) {
        if (!this.gameEngine) return null;
        
        const isAlive = this.gameEngine.getCell(row, col);
        const neighbors = this.gameEngine.countNeighbors(row, col);
        
        let maturity = 0;
        let deadTime = 0;
        
        if (this.maturitySystem) {
            maturity = this.maturitySystem.getMaturity(row, col);
            deadTime = this.maturitySystem.getDeadTime(row, col);
        }
        
        return {
            row,
            col,
            isAlive,
            maturity,
            deadTime,
            neighbors
        };
    }
    
    createTooltip() {
        if (this.tooltip) return;
        
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'cell-inspector-tooltip';
        document.body.appendChild(this.tooltip);
    }
    
    removeTooltip() {
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
    }
    
    showTooltip(cellInfo, x, y) {
        if (!this.tooltip || !cellInfo) return;
        
        const content = this.formatTooltipContent(cellInfo);
        this.tooltip.innerHTML = content;
        this.tooltip.style.left = `${x + 10}px`;
        this.tooltip.style.top = `${y - 10}px`;
        this.tooltip.classList.add('show');
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.classList.remove('show');
        }
    }
    
    formatTooltipContent(cellInfo) {
        const { row, col, isAlive, maturity, deadTime, neighbors } = cellInfo;
        
        let content = `
            <div class="tooltip-cell-info">
                <span class="tooltip-label">Position:</span> 
                <span class="tooltip-value">(${col}, ${row})</span>
            </div>
            <div class="tooltip-cell-info">
                <span class="tooltip-label">State:</span> 
                <span class="tooltip-value ${isAlive ? 'alive' : 'dead'}">${isAlive ? 'Alive' : 'Dead'}</span>
            </div>
            <div class="tooltip-cell-info">
                <span class="tooltip-label">Neighbors:</span> 
                <span class="tooltip-value">${neighbors}</span>
            </div>
        `;
        
        if (this.maturitySystem && this.maturitySystem.isActive) {
            if (isAlive) {
                content += `
                    <div class="tooltip-cell-info">
                        <span class="tooltip-label">Alive for:</span> 
                        <span class="tooltip-value">${maturity + 1} generation${maturity === 0 ? '' : 's'}</span>
                    </div>
                `;
            } else if (deadTime > 0) {
                content += `
                    <div class="tooltip-cell-info">
                        <span class="tooltip-label">Dead for:</span> 
                        <span class="tooltip-value">${deadTime + 1} generation${deadTime === 0 ? '' : 's'}</span>
                    </div>
                `;
            }
        }
        
        return content;
    }
    
    // Settings for persistence
    getSettings() {
        return {
            isActive: this.isActive
        };
    }
    
    applySettings(settings) {
        if (settings.isActive) {
            this.activate();
        }
    }
}
