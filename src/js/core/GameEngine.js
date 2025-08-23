/**
 * Conway's Game of Life Engine
 * Pure game logic separated from UI and rendering
 */

import { eventBus } from '../utils/EventEmitter.js';
import { EVENTS } from '../utils/Constants.js';

export class GameEngine {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.grid = [];
        this.generation = 0;
        this.initializeGrid();
    }
    
    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = false; // false = dead, true = alive
            }
        }
        
        eventBus.emit(EVENTS.GRID_RESIZE, { rows: this.rows, cols: this.cols });
    }
    
    resize(newRows, newCols) {
        // Preserve existing cells when resizing
        const oldGrid = [...this.grid];
        const oldRows = this.rows;
        const oldCols = this.cols;
        
        this.rows = newRows;
        this.cols = newCols;
        this.initializeGrid();
        
        // Copy old grid to new grid (up to the smaller dimensions)
        const copyRows = Math.min(oldRows, newRows);
        const copyCols = Math.min(oldCols, newCols);
        
        for (let row = 0; row < copyRows; row++) {
            for (let col = 0; col < copyCols; col++) {
                if (oldGrid[row] && oldGrid[row][col] !== undefined) {
                    this.grid[row][col] = oldGrid[row][col];
                }
            }
        }
        
        eventBus.emit(EVENTS.GRID_RESIZE, { rows: this.rows, cols: this.cols });
    }
    
    countNeighbors(row, col) {
        let count = 0;
        
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue; // Skip the cell itself
                
                const newRow = row + i;
                const newCol = col + j;
                
                // Check bounds and count living neighbors
                if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                    if (this.grid[newRow][newCol]) {
                        count++;
                    }
                }
            }
        }
        
        return count;
    }
    
    nextGeneration() {
        const newGrid = [];
        
        // Create new grid
        for (let row = 0; row < this.rows; row++) {
            newGrid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                newGrid[row][col] = false;
            }
        }
        
        // Apply Conway's Game of Life rules
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const neighbors = this.countNeighbors(row, col);
                const isAlive = this.grid[row][col];
                
                if (isAlive) {
                    // Rule 1: Any live cell with fewer than two live neighbors dies (underpopulation)
                    // Rule 2: Any live cell with two or three live neighbors lives on
                    // Rule 3: Any live cell with more than three live neighbors dies (overpopulation)
                    if (neighbors === 2 || neighbors === 3) {
                        newGrid[row][col] = true;
                    }
                } else {
                    // Rule 4: Any dead cell with exactly three live neighbors becomes a live cell (reproduction)
                    if (neighbors === 3) {
                        newGrid[row][col] = true;
                    }
                }
            }
        }
        
        // Store old grid for comparison (used by visual effects)
        const oldGrid = [...this.grid];
        this.grid = newGrid;
        this.generation++;
        
        // Emit events for visual effects systems
        eventBus.emit(EVENTS.GENERATION_UPDATE, {
            generation: this.generation,
            population: this.calculatePopulation(),
            oldGrid: oldGrid,
            newGrid: newGrid
        });
        
        return this.grid;
    }
    
    setCell(row, col, alive) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.grid[row][col] = alive;
            eventBus.emit(EVENTS.CELL_TOGGLE, { row, col, alive });
        }
    }
    
    getCell(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.grid[row][col];
        }
        return false;
    }
    
    toggleCell(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.grid[row][col] = !this.grid[row][col];
            const alive = this.grid[row][col];
            eventBus.emit(EVENTS.CELL_TOGGLE, { row, col, alive });
            return alive;
        }
        return false;
    }
    
    clearGrid() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = false;
            }
        }
        this.generation = 0;
        eventBus.emit(EVENTS.GRID_CLEAR);
    }
    
    randomize(density = 0.3, seed = null) {
        if (seed !== null) {
            this.seedRandom(seed);
        }
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = Math.random() < density;
            }
        }
        this.generation = 0;
        eventBus.emit(EVENTS.GRID_CLEAR); // Treat as grid clear for visual effects
    }
    
    seedRandom(seed) {
        // Simple seeded random - replace Math.random temporarily
        let m = 0x80000000; // 2**31;
        let a = 1103515245;
        let c = 12345;
        seed = seed || 1;
        
        const originalRandom = Math.random;
        Math.random = function() {
            seed = (a * seed + c) % m;
            return seed / (m - 1);
        };
        
        // Restore original random after use
        setTimeout(() => { Math.random = originalRandom; }, 100);
    }
    
    placePattern(pattern, startRow, startCol, rotation = 0) {
        if (!pattern || !Array.isArray(pattern)) return false;
        
        const rotatedPattern = this.rotatePattern(pattern, rotation);
        
        for (let i = 0; i < rotatedPattern.length; i++) {
            for (let j = 0; j < rotatedPattern[i].length; j++) {
                const row = startRow + i;
                const col = startCol + j;
                
                if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                    if (rotatedPattern[i][j] === 1) {
                        this.grid[row][col] = true;
                    }
                }
            }
        }
        
        eventBus.emit(EVENTS.PATTERN_PLACE, { pattern, startRow, startCol, rotation });
        return true;
    }
    
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
    
    calculatePopulation() {
        let count = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col]) {
                    count++;
                }
            }
        }
        return count;
    }
    
    getGridCopy() {
        return this.grid.map(row => [...row]);
    }
    
    setGrid(newGrid) {
        if (!Array.isArray(newGrid) || newGrid.length !== this.rows) {
            return false;
        }
        
        for (let row = 0; row < this.rows; row++) {
            if (!Array.isArray(newGrid[row]) || newGrid[row].length !== this.cols) {
                return false;
            }
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = Boolean(newGrid[row][col]);
            }
        }
        
        return true;
    }
    
    // Quick fill methods
    fillEdges(density = 0.5) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (row === 0 || row === this.rows - 1 || col === 0 || col === this.cols - 1) {
                    this.grid[row][col] = Math.random() < density;
                }
            }
        }
    }
    
    fillCenter(density = 0.4) {
        const centerRow = Math.floor(this.rows / 2);
        const centerCol = Math.floor(this.cols / 2);
        const radius = Math.min(this.rows, this.cols) / 6;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const distance = Math.sqrt((row - centerRow) ** 2 + (col - centerCol) ** 2);
                if (distance <= radius) {
                    this.grid[row][col] = Math.random() < density;
                }
            }
        }
    }
    
    invertAll() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = !this.grid[row][col];
            }
        }
    }
}
