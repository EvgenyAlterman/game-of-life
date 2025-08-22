class GameOfLife {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Grid dimensions
        this.cellSize = 10;
        this.rows = Math.floor(this.canvas.height / this.cellSize);
        this.cols = Math.floor(this.canvas.width / this.cellSize);
        
        // Game state
        this.grid = [];
        this.isRunning = false;
        this.generation = 0;
        this.animationId = null;
        this.speed = 5; // Updates per second
        this.lastTime = 0;
        
        // UI elements
        this.startStopBtn = document.getElementById('startStopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.randomBtn = document.getElementById('randomBtn');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedValue');
        this.generationDisplay = document.getElementById('generation');
        this.populationDisplay = document.getElementById('population');
        
        this.initializeGrid();
        this.setupEventListeners();
        this.draw();
        this.updateInfo();
    }
    
    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = false; // false = dead, true = alive
            }
        }
    }
    
    setupEventListeners() {
        // Start/Stop button
        this.startStopBtn.addEventListener('click', () => {
            this.toggleSimulation();
        });
        
        // Reset button
        this.resetBtn.addEventListener('click', () => {
            this.reset();
        });
        
        // Random button
        this.randomBtn.addEventListener('click', () => {
            this.randomize();
        });
        
        // Speed slider
        this.speedSlider.addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            this.speedValue.textContent = this.speed;
        });
        
        // Canvas click to toggle cells
        this.canvas.addEventListener('click', (e) => {
            if (!this.isRunning) {
                this.toggleCell(e);
            }
        });
        
        // Canvas mouse drag to draw
        let isDrawing = false;
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.isRunning) {
                isDrawing = true;
                this.toggleCell(e);
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (isDrawing && !this.isRunning) {
                this.setCellAlive(e);
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            isDrawing = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            isDrawing = false;
        });
    }
    
    toggleCell(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.grid[row][col] = !this.grid[row][col];
            this.draw();
            this.updateInfo();
        }
    }
    
    setCellAlive(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.grid[row][col] = true;
            this.draw();
            this.updateInfo();
        }
    }
    
    toggleSimulation() {
        this.isRunning = !this.isRunning;
        
        if (this.isRunning) {
            this.startStopBtn.textContent = 'Stop';
            this.startStopBtn.style.background = 'linear-gradient(45deg, #e53e3e, #c53030)';
            this.animate(0);
        } else {
            this.startStopBtn.textContent = 'Start';
            this.startStopBtn.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        }
    }
    
    animate(currentTime) {
        if (!this.isRunning) return;
        
        const interval = 1000 / this.speed;
        
        if (currentTime - this.lastTime >= interval) {
            this.update();
            this.lastTime = currentTime;
        }
        
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }
    
    update() {
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
        
        this.grid = newGrid;
        this.generation++;
        this.draw();
        this.updateInfo();
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
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let col = 0; col <= this.cols; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.cellSize, 0);
            this.ctx.lineTo(col * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let row = 0; row <= this.rows; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.cellSize);
            this.ctx.lineTo(this.canvas.width, row * this.cellSize);
            this.ctx.stroke();
        }
        
        // Draw living cells
        this.ctx.fillStyle = '#4299e1';
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col]) {
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
    
    reset() {
        this.isRunning = false;
        this.generation = 0;
        this.startStopBtn.textContent = 'Start';
        this.startStopBtn.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.initializeGrid();
        this.draw();
        this.updateInfo();
    }
    
    randomize() {
        if (this.isRunning) return;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = Math.random() < 0.3; // 30% chance of being alive
            }
        }
        this.generation = 0;
        this.draw();
        this.updateInfo();
    }
    
    updateInfo() {
        this.generationDisplay.textContent = this.generation;
        
        let population = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col]) {
                    population++;
                }
            }
        }
        this.populationDisplay.textContent = population;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new GameOfLife('gameCanvas');
    
    // Add some initial patterns for demonstration
    const patterns = {
        glider: [
            [0, 1, 0],
            [0, 0, 1],
            [1, 1, 1]
        ],
        blinker: [
            [1, 1, 1]
        ],
        block: [
            [1, 1],
            [1, 1]
        ]
    };
    
    // Add a glider pattern in the middle for demo
    setTimeout(() => {
        const startRow = Math.floor(game.rows / 2);
        const startCol = Math.floor(game.cols / 2);
        
        const pattern = patterns.glider;
        for (let i = 0; i < pattern.length; i++) {
            for (let j = 0; j < pattern[i].length; j++) {
                if (startRow + i < game.rows && startCol + j < game.cols) {
                    game.grid[startRow + i][startCol + j] = pattern[i][j] === 1;
                }
            }
        }
        
        game.draw();
        game.updateInfo();
    }, 100);
});
