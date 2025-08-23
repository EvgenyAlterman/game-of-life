/**
 * Canvas Renderer
 * Handles all drawing operations for the Game of Life
 */

import { eventBus } from '../utils/EventEmitter.js';
import { ColorUtils } from '../utils/ColorUtils.js';
import { EVENTS } from '../utils/Constants.js';

export class CanvasRenderer {
    constructor(canvas, cellSize = 10) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = cellSize;
        this.showGrid = false;
        this.showGridOverlay = false;
        
        this.theme = 'system';
        this.colors = this.getThemeColors();
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        eventBus.on(EVENTS.THEME_CHANGE, (theme) => {
            this.theme = theme;
            this.colors = this.getThemeColors();
        });
        
        eventBus.on(EVENTS.GRID_OVERLAY_TOGGLE, () => {
            this.showGridOverlay = !this.showGridOverlay;
        });
        
        eventBus.on('grid:overlay:set:state', (show) => {
            this.showGridOverlay = show;
        });
    }
    
    getThemeColors() {
        // Get colors from CSS custom properties
        const root = getComputedStyle(document.documentElement);
        
        return {
            grid: root.getPropertyValue('--canvas-grid').trim() || '#E0E0E0',
            cell: root.getPropertyValue('--canvas-cell').trim() || '#4A90E2',
            background: root.getPropertyValue('--bg-canvas').trim() || '#FFFFFF',
            preview: '#4A90E280'
        };
    }
    
    resize(width, height, cellSize) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.cellSize = cellSize;
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawGrid(grid, options = {}) {
        const {
            fadeGrid = null,
            fadeMode = false,
            fadeDuration = 1,
            matureCells = [],
            previewCells = []
        } = options;
        
        // Clear canvas
        this.clear();
        
        // Draw basic grid lines
        this.drawBasicGrid();
        
        // Draw living cells
        this.drawCells(grid);
        
        // Draw fading cells if fade mode is enabled
        if (fadeMode && fadeGrid) {
            this.drawFadingCells(fadeGrid, fadeDuration);
        }
        
        // Draw mature cells
        if (matureCells && matureCells.length > 0) {
            this.drawMatureCells(matureCells);
        }
        
        // Draw preview cells
        if (previewCells && previewCells.length > 0) {
            this.drawPreviewCells(previewCells);
        }
        
        // Draw grid overlay (every 5 cells with thicker lines)
        if (this.showGridOverlay) {
            this.drawGridOverlay();
        }
    }
    
    drawBasicGrid() {
        const cols = Math.floor(this.canvas.width / this.cellSize);
        const rows = Math.floor(this.canvas.height / this.cellSize);
        
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let col = 0; col <= cols; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.cellSize, 0);
            this.ctx.lineTo(col * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let row = 0; row <= rows; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.cellSize);
            this.ctx.lineTo(this.canvas.width, row * this.cellSize);
            this.ctx.stroke();
        }
    }
    
    drawCells(grid) {
        this.ctx.fillStyle = this.colors.cell;
        
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                if (grid[row][col]) {
                    this.ctx.fillRect(
                        col * this.cellSize + 1,
                        row * this.cellSize + 1,
                        this.cellSize - 2,
                        this.cellSize - 2
                    );
                }
            }
        }
    }
    
    drawFadingCells(fadeGrid, fadeDuration) {
        const baseCellColor = this.colors.cell;
        
        for (let row = 0; row < fadeGrid.length; row++) {
            for (let col = 0; col < fadeGrid[row].length; col++) {
                const fadeLevel = fadeGrid[row][col];
                
                if (fadeLevel > 0) {
                    // Calculate opacity based on fade level (higher = more opaque)
                    const opacity = fadeLevel / fadeDuration * 0.8; // Max 80% opacity
                    const fadeColor = ColorUtils.hexToRgba(baseCellColor, opacity);
                    
                    this.ctx.fillStyle = fadeColor;
                    this.ctx.fillRect(
                        col * this.cellSize + 1,
                        row * this.cellSize + 1,
                        this.cellSize - 2,
                        this.cellSize - 2
                    );
                }
            }
        }
    }
    
    drawMatureCells(matureCells) {
        for (const cell of matureCells) {
            this.ctx.fillStyle = cell.color;
            this.ctx.fillRect(
                cell.col * this.cellSize + 1,
                cell.row * this.cellSize + 1,
                this.cellSize - 2,
                this.cellSize - 2
            );
        }
    }
    
    drawPreviewCells(previewCells) {
        const previewColor = ColorUtils.hexToRgba(this.colors.cell, 0.3); // 30% opacity
        this.ctx.fillStyle = previewColor;
        
        for (const cell of previewCells) {
            this.ctx.fillRect(
                cell.col * this.cellSize + 1,
                cell.row * this.cellSize + 1,
                this.cellSize - 2,
                this.cellSize - 2
            );
        }
    }
    
    drawGridOverlay() {
        const cols = Math.floor(this.canvas.width / this.cellSize);
        const rows = Math.floor(this.canvas.height / this.cellSize);
        
        // Create a more visible grid color
        let overlayColor;
        const gridColor = this.colors.grid;
        
        if (gridColor.includes('rgb')) {
            // For RGB colors, make them more opaque
            overlayColor = gridColor.replace(/rgba?\(([^)]*)\)/, (match, values) => {
                const parts = values.split(',').map(v => v.trim());
                if (parts.length === 3) {
                    return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, 0.6)`;
                } else if (parts.length === 4) {
                    return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, 0.6)`;
                }
                return gridColor;
            });
        } else if (gridColor.includes('#')) {
            // Convert hex to rgba with more opacity
            overlayColor = ColorUtils.hexToRgba(gridColor, 0.6);
        } else {
            // Fallback
            overlayColor = 'rgba(128, 128, 128, 0.6)';
        }
        
        this.ctx.strokeStyle = overlayColor;
        this.ctx.lineWidth = 2;
        
        // Draw thicker vertical lines every 5 cells
        for (let col = 0; col <= cols; col += 5) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.cellSize, 0);
            this.ctx.lineTo(col * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw thicker horizontal lines every 5 cells
        for (let row = 0; row <= rows; row += 5) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.cellSize);
            this.ctx.lineTo(this.canvas.width, row * this.cellSize);
            this.ctx.stroke();
        }
        
        // Reset line width
        this.ctx.lineWidth = 1;
    }
    
    drawPatternPreview(pattern, centerRow, centerCol, rotation = 0, opacity = 0.3) {
        if (!pattern || !Array.isArray(pattern)) return [];
        
        const rotatedPattern = this.rotatePattern(pattern, rotation);
        
        // Calculate pattern placement (centered on click position)
        const startRow = centerRow - Math.floor(rotatedPattern.length / 2);
        const startCol = centerCol - Math.floor(rotatedPattern[0].length / 2);
        
        const previewCells = [];
        
        // Generate preview cells
        for (let i = 0; i < rotatedPattern.length; i++) {
            for (let j = 0; j < rotatedPattern[i].length; j++) {
                const row = startRow + i;
                const col = startCol + j;
                
                if (row >= 0 && col >= 0 && rotatedPattern[i][j] === 1) {
                    previewCells.push({ row, col });
                }
            }
        }
        
        return previewCells;
    }
    
    // Utility methods
    rotatePattern(pattern, degrees) {
        if (degrees === 0) return pattern;
        
        const times = (degrees / 90) % 4;
        let rotated = pattern;
        
        for (let i = 0; i < times; i++) {
            rotated = this.rotatePattern90(rotated);
        }
        
        return rotated;
    }
    
    rotatePattern90(pattern) {
        const rows = pattern.length;
        const cols = pattern[0].length;
        const rotated = [];
        
        for (let j = 0; j < cols; j++) {
            rotated[j] = [];
            for (let i = rows - 1; i >= 0; i--) {
                rotated[j][cols - 1 - i] = pattern[i][j];
            }
        }
        
        return rotated;
    }
    
    getCanvasPosition(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
    
    getCellFromPosition(x, y) {
        return {
            row: Math.floor(y / this.cellSize),
            col: Math.floor(x / this.cellSize)
        };
    }
    
    // Settings for persistence
    getSettings() {
        return {
            showGridOverlay: this.showGridOverlay
        };
    }
    
    applySettings(settings) {
        if (settings.showGridOverlay !== undefined) {
            this.showGridOverlay = settings.showGridOverlay;
        }
    }
}
