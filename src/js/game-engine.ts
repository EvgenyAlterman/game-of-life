import type { 
    GameSnapshot, 
    GenerationUpdate, 
    GameRules 
} from '../types/game-types.js';

/**
 * Conway's Game of Life Engine
 * Core game logic separated from UI presentation
 */
export class GameOfLifeEngine {
    public rows: number;
    public cols: number;
    public grid: boolean[][];
    public generation: number;
    public maturityGrid: number[][];
    public deadGrid: number[][];
    public fadeGrid: number[][];
    public isRunning: boolean;
    public birthRules: number[];
    public survivalRules: number[];

    constructor(rows: number = 40, cols: number = 60) {
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
        
        // Custom rules settings (B3/S23 = Conway's Game of Life)
        this.birthRules = [3]; // Dead cells become alive with these neighbor counts
        this.survivalRules = [2, 3]; // Live cells survive with these neighbor counts
        
        // Initialize grids
        this.initializeGrids();
    }
    
    /**
     * Initialize all game grids with empty states
     */
    initializeGrids(): void {
        this.grid = [];
        this.maturityGrid = [];
        this.deadGrid = [];
        this.fadeGrid = [];
        
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [] as boolean[];
            this.maturityGrid[row] = [] as number[];
            this.deadGrid[row] = [] as number[];
            this.fadeGrid[row] = [] as number[];
            
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
    resize(newRows: number, newCols: number): void {
        this.rows = newRows;
        this.cols = newCols;
        this.initializeGrids();
        this.generation = 0;
    }
    
    /**
     * Get cell state at position
     */
    getCell(row: number, col: number): boolean {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.grid[row][col];
        }
        return false;
    }
    
    /**
     * Set cell state at position
     */
    setCell(row: number, col: number, state: boolean): void {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.grid[row][col] = state;
        }
    }
    
    /**
     * Toggle cell state at position
     */
    toggleCell(row: number, col: number): void {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.grid[row][col] = !this.grid[row][col];
        }
    }
    
    /**
     * Count living neighbors around a cell
     */
    countNeighbors(row: number, col: number): number {
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
    updateGeneration(): GenerationUpdate {
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
                    // Survival rules: Live cell survives if neighbor count is in survivalRules
                    if (this.survivalRules.includes(neighbors)) {
                        newGrid[row][col] = true;
                    }
                } else {
                    // Birth rules: Dead cell becomes alive if neighbor count is in birthRules
                    if (this.birthRules.includes(neighbors)) {
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
    updateStateTracking(newGrid: boolean[][]): void {
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
    updateFadeGrid(fadeDuration: number): void {
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
    clear(): void {
        this.initializeGrids();
        this.generation = 0;
    }
    
    /**
     * Randomize grid with given density (0-1)
     */
    randomize(density: number = 0.3, seed: number | null = null): void {
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
    clearStateTracking(): void {
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
    seedRandom(seed: number): void {
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
    getPopulation(): number {
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
    getCellMaturity(row: number, col: number): number {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.maturityGrid[row][col];
        }
        return 0;
    }
    
    /**
     * Get cell dead time at position
     */
    getCellDeadTime(row: number, col: number): number {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.deadGrid[row][col];
        }
        return 0;
    }
    
    /**
     * Get cell fade level at position
     */
    getCellFadeLevel(row: number, col: number): number {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.fadeGrid[row][col];
        }
        return 0;
    }
    
    /**
     * Place a pattern at given position
     */
    placePattern(pattern: number[][], centerRow: number, centerCol: number): void {
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
    invert(): void {
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
    fillEdges(density: number = 0.5): void {
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
    fillCenter(density: number = 0.4): void {
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
    getGridSnapshot(): GameSnapshot {
        return {
            grid: this.grid.map(row => [...row]),
            maturityGrid: this.maturityGrid.map(row => [...row]),
            deadGrid: this.deadGrid.map(row => [...row]),
            fadeGrid: this.fadeGrid.map(row => [...row]),
            generation: this.generation,
            population: this.getPopulation(),
            rows: this.rows,
            cols: this.cols,
            birthRules: [...this.birthRules], // Include custom rules
            survivalRules: [...this.survivalRules]
        };
    }
    
    /**
     * Restore grid state from snapshot
     */
    restoreFromSnapshot(snapshot: GameSnapshot): void {
        this.rows = snapshot.rows;
        this.cols = snapshot.cols;
        this.grid = snapshot.grid.map(row => [...row]);
        this.maturityGrid = snapshot.maturityGrid.map(row => [...row]);
        this.deadGrid = snapshot.deadGrid.map(row => [...row]);
        this.fadeGrid = snapshot.fadeGrid.map(row => [...row]);
        this.generation = snapshot.generation;
        
        // Restore custom rules if available
        if (snapshot.birthRules) {
            this.birthRules = [...snapshot.birthRules];
        }
        if (snapshot.survivalRules) {
            this.survivalRules = [...snapshot.survivalRules];
        }
    }
    
    /**
     * Set custom birth rules
     * @param rules - Array of neighbor counts that cause birth
     */
    setBirthRules(rules: number[]): void {
        this.birthRules = [...rules];
    }
    
    /**
     * Set custom survival rules
     * @param rules - Array of neighbor counts that allow survival
     */
    setSurvivalRules(rules: number[]): void {
        this.survivalRules = [...rules];
    }
    
    /**
     * Set both birth and survival rules from a rule string (e.g., "B3/S23")
     * @param ruleString - Standard cellular automaton rule notation
     */
    setRulesFromString(ruleString: string): void {
        try {
            // Parse rule string like "B3/S23" or "B36/S23"
            const parts = ruleString.toUpperCase().split('/');
            
            if (parts.length !== 2 || !parts[0].startsWith('B') || !parts[1].startsWith('S')) {
                throw new Error('Invalid rule format');
            }
            
            // Extract birth rules
            const birthPart = parts[0].substring(1); // Remove 'B'
            this.birthRules = birthPart ? birthPart.split('').map(n => parseInt(n)).filter(n => !isNaN(n) && n >= 0 && n <= 8) : [];
            
            // Extract survival rules
            const survivalPart = parts[1].substring(1); // Remove 'S'
            this.survivalRules = survivalPart ? survivalPart.split('').map(n => parseInt(n)).filter(n => !isNaN(n) && n >= 0 && n <= 8) : [];
            
        } catch (error) {
            console.warn('Failed to parse rule string:', ruleString, error);
            // Fallback to Conway's Game of Life
            this.birthRules = [3];
            this.survivalRules = [2, 3];
        }
    }
    
    /**
     * Get current rules as a string (e.g., "B3/S23")
     * @returns Standard cellular automaton rule notation
     */
    getRulesAsString(): string {
        const birthString = this.birthRules.sort((a, b) => a - b).join('');
        const survivalString = this.survivalRules.sort((a, b) => a - b).join('');
        return `B${birthString}/S${survivalString}`;
    }
}
