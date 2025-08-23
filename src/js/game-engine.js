/**
 * Conway's Game of Life Engine
 * Core game logic separated from UI presentation
 */
export class GameOfLifeEngine {
    constructor(rows = 40, cols = 60) {
        this.rows = rows;
        this.cols = cols;
        
        // Core game state
        this.grid = [];
        this.generation = 0;
        
        // State tracking grids
        this.maturityGrid = []; // Tracks how long cells have been alive
        this.deadGrid = []; // Tracks how long cells have been dead
        this.fadeGrid = []; // Tracks fade levels for ghost trail
        
        // Game settings
        this.isRunning = false;
        
        // Initialize grids
        this.initializeGrids();
    }
    
    /**
     * Initialize all game grids with empty states
     */
    initializeGrids() {
        this.grid = [];
        this.maturityGrid = [];
        this.deadGrid = [];
        this.fadeGrid = [];
        
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            this.maturityGrid[row] = [];
            this.deadGrid[row] = [];
            this.fadeGrid[row] = [];
            
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = false; // false = dead, true = alive
                this.maturityGrid[row][col] = 0; // 0 = newborn, higher = more mature
                this.deadGrid[row][col] = 0; // 0 = just died, higher = longer dead
                this.fadeGrid[row][col] = 0; // 0 = no fade, > 0 = fade level
            }
        }
    }
    
    /**
     * Resize the grid to new dimensions
     */
    resize(newRows, newCols) {
        this.rows = newRows;
        this.cols = newCols;
        this.initializeGrids();
        this.generation = 0;
    }
    
    /**
     * Get cell state at position
     */
    getCell(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.grid[row][col];
        }
        return false;
    }
    
    /**
     * Set cell state at position
     */
    setCell(row, col, state) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.grid[row][col] = state;
        }
    }
    
    /**
     * Toggle cell state at position
     */
    toggleCell(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.grid[row][col] = !this.grid[row][col];
        }
    }
    
    /**
     * Count living neighbors around a cell
     */
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
    
    /**
     * Apply Conway's Game of Life rules for one generation
     */
    updateGeneration() {
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
        
        // Update state tracking grids
        this.updateStateTracking(newGrid);
        
        // Update grid and increment generation
        this.grid = newGrid;
        this.generation++;
        
        return {
            grid: this.grid,
            generation: this.generation,
            population: this.getPopulation()
        };
    }
    
    /**
     * Update maturity and dead cell tracking
     */
    updateStateTracking(newGrid) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const wasAlive = this.grid[row][col];
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
    
    /**
     * Update fade grid for ghost trail effect
     */
    updateFadeGrid(fadeDuration) {
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
                const isAlive = this.grid[row][col];
                const maturity = this.maturityGrid[row][col];
                
                // If cell just died (maturity was > 0 but now cell is dead), start fade
                if (!isAlive && maturity === 0 && this.deadGrid[row][col] === 0) {
                    this.fadeGrid[row][col] = fadeDuration;
                } else if (isAlive) {
                    // Cell is alive - no fade
                    this.fadeGrid[row][col] = 0;
                }
            }
        }
    }
    
    /**
     * Clear all grids
     */
    clear() {
        this.initializeGrids();
        this.generation = 0;
    }
    
    /**
     * Randomize grid with given density (0-1)
     */
    randomize(density = 0.3, seed = null) {
        // Use seeded random if seed is provided
        if (seed !== null) {
            this.seedRandom(seed);
        }
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = Math.random() < density;
            }
        }
        
        this.generation = 0;
        this.clearStateTracking();
    }
    
    /**
     * Clear all state tracking grids
     */
    clearStateTracking() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.maturityGrid[row][col] = 0;
                this.deadGrid[row][col] = 0;
                this.fadeGrid[row][col] = 0;
            }
        }
    }
    
    /**
     * Simple seeded random number generator
     */
    seedRandom(seed) {
        let m = 0x80000000; // 2**31;
        let a = 1103515245;
        let c = 12345;
        
        const originalRandom = Math.random;
        Math.random = function() {
            seed = (a * seed + c) % m;
            return seed / (m - 1);
        };
        
        // Restore original random after use
        setTimeout(() => { Math.random = originalRandom; }, 100);
    }
    
    /**
     * Get current population count
     */
    getPopulation() {
        let population = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col]) {
                    population++;
                }
            }
        }
        return population;
    }
    
    /**
     * Get cell maturity at position
     */
    getCellMaturity(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.maturityGrid[row][col];
        }
        return 0;
    }
    
    /**
     * Get cell dead time at position
     */
    getCellDeadTime(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.deadGrid[row][col];
        }
        return 0;
    }
    
    /**
     * Get cell fade level at position
     */
    getCellFadeLevel(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.fadeGrid[row][col];
        }
        return 0;
    }
    
    /**
     * Place a pattern at given position
     */
    placePattern(pattern, centerRow, centerCol) {
        const startRow = centerRow - Math.floor(pattern.length / 2);
        const startCol = centerCol - Math.floor(pattern[0].length / 2);
        
        for (let i = 0; i < pattern.length; i++) {
            for (let j = 0; j < pattern[i].length; j++) {
                const row = startRow + i;
                const col = startCol + j;
                if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                    if (pattern[i][j] === 1) {
                        this.grid[row][col] = true;
                    }
                }
            }
        }
    }
    
    /**
     * Invert all cells
     */
    invert() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = !this.grid[row][col];
            }
        }
        this.clearStateTracking();
    }
    
    /**
     * Fill edges with random pattern
     */
    fillEdges(density = 0.5) {
        this.clear();
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (row === 0 || row === this.rows - 1 || col === 0 || col === this.cols - 1) {
                    this.grid[row][col] = Math.random() < density;
                }
            }
        }
    }
    
    /**
     * Fill center area with random pattern
     */
    fillCenter(density = 0.4) {
        this.clear();
        
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
    
    /**
     * Get a deep copy of the current grid state
     */
    getGridSnapshot() {
        return {
            grid: this.grid.map(row => [...row]),
            maturityGrid: this.maturityGrid.map(row => [...row]),
            deadGrid: this.deadGrid.map(row => [...row]),
            fadeGrid: this.fadeGrid.map(row => [...row]),
            generation: this.generation,
            population: this.getPopulation(),
            rows: this.rows,
            cols: this.cols
        };
    }
    
    /**
     * Restore grid state from snapshot
     */
    restoreFromSnapshot(snapshot) {
        this.rows = snapshot.rows;
        this.cols = snapshot.cols;
        this.grid = snapshot.grid.map(row => [...row]);
        this.maturityGrid = snapshot.maturityGrid.map(row => [...row]);
        this.deadGrid = snapshot.deadGrid.map(row => [...row]);
        this.fadeGrid = snapshot.fadeGrid.map(row => [...row]);
        this.generation = snapshot.generation;
    }
}
