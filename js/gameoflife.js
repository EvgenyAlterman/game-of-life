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
        
        // UI elements - basic controls
        this.startStopBtn = document.getElementById('startStopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.randomBtn = document.getElementById('randomBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedValue');
        this.generationDisplay = document.getElementById('generation');
        this.populationDisplay = document.getElementById('population');
        
        // UI elements - advanced controls
        this.gridWidthSlider = document.getElementById('gridWidth');
        this.gridWidthValue = document.getElementById('gridWidthValue');
        this.gridWidthMax = document.getElementById('gridWidthMax');
        this.gridHeightSlider = document.getElementById('gridHeight');
        this.gridHeightValue = document.getElementById('gridHeightValue');
        this.gridHeightMax = document.getElementById('gridHeightMax');
        this.cellSizeSlider = document.getElementById('cellSize');
        this.cellSizeValue = document.getElementById('cellSizeValue');
        this.cellSizeMax = document.getElementById('cellSizeMax');
        this.applyGridBtn = document.getElementById('applyGridBtn');
        this.randomDensitySlider = document.getElementById('randomDensity');
        this.randomDensityValue = document.getElementById('randomDensityValue');
        this.randomDensityMax = document.getElementById('randomDensityMax');
        this.randomSeedInput = document.getElementById('randomSeed');
        this.generateSeedBtn = document.getElementById('generateSeedBtn');
        this.speedMax = document.getElementById('speedMax');
        
        // UI elements - sidebar
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.sidebar = document.querySelector('.sidebar');
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        
        // UI elements - dark mode
        this.darkModeToggle = document.getElementById('darkModeToggle');
        
        // Random generation settings
        this.randomDensity = 30; // percentage
        this.randomSeed = null;
        
        // Drawing tool settings
        this.drawingMode = 'cell'; // 'cell' or pattern name
        this.selectedPattern = null;
        
        this.initializeGrid();
        this.setupEventListeners();
        this.initializeDarkMode();
        this.loadSettings();
        this.draw();
        this.updateInfo();
        this.updateDrawingModeUI();
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
        
        // Clear button
        this.clearBtn.addEventListener('click', () => {
            this.clearAll();
        });
        
        // Random button
        this.randomBtn.addEventListener('click', () => {
            this.randomize();
        });
        
        // Speed slider
        this.speedSlider.addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            this.speedValue.textContent = this.speed;
            this.saveSettings();
        });
        
        // Speed max value
        this.speedMax.addEventListener('input', (e) => {
            this.updateSliderMax(this.speedSlider, e.target.value);
            this.saveSettings();
        });
        
        // Sidebar toggle
        this.sidebarToggle.addEventListener('click', () => {
            this.toggleSidebar();
            this.saveSettings();
        });
        
        // Mobile menu button
        this.mobileMenuBtn.addEventListener('click', () => {
            this.openMobileSidebar();
        });
        
        // Sidebar overlay (for mobile)
        this.sidebarOverlay.addEventListener('click', () => {
            this.closeMobileSidebar();
        });
        
        // Dark mode toggle
        this.darkModeToggle.addEventListener('click', () => {
            this.toggleDarkMode();
        });
        
        // Advanced controls - Grid settings
        this.gridWidthSlider.addEventListener('input', (e) => {
            this.gridWidthValue.textContent = e.target.value;
            this.saveSettings();
        });
        
        this.gridWidthMax.addEventListener('input', (e) => {
            this.updateSliderMax(this.gridWidthSlider, e.target.value);
            this.saveSettings();
        });
        
        this.gridHeightSlider.addEventListener('input', (e) => {
            this.gridHeightValue.textContent = e.target.value;
            this.saveSettings();
        });
        
        this.gridHeightMax.addEventListener('input', (e) => {
            this.updateSliderMax(this.gridHeightSlider, e.target.value);
            this.saveSettings();
        });
        
        this.cellSizeSlider.addEventListener('input', (e) => {
            this.cellSizeValue.textContent = e.target.value + 'px';
            this.saveSettings();
        });
        
        this.cellSizeMax.addEventListener('input', (e) => {
            this.updateSliderMax(this.cellSizeSlider, e.target.value);
            this.saveSettings();
        });
        
        this.applyGridBtn.addEventListener('click', () => {
            this.applyGridSettings();
        });
        
        // Advanced controls - Random settings
        this.randomDensitySlider.addEventListener('input', (e) => {
            this.randomDensity = parseInt(e.target.value);
            this.randomDensityValue.textContent = this.randomDensity + '%';
            this.saveSettings();
        });
        
        this.randomDensityMax.addEventListener('input', (e) => {
            this.updateSliderMax(this.randomDensitySlider, e.target.value);
            this.saveSettings();
        });
        
        this.generateSeedBtn.addEventListener('click', () => {
            this.generateRandomSeed();
        });
        
        this.randomSeedInput.addEventListener('input', (e) => {
            this.randomSeed = e.target.value ? parseInt(e.target.value) : null;
            this.saveSettings();
        });
        
        // Cell drawing button
        document.getElementById('cellDrawingBtn').addEventListener('click', () => {
            this.selectCellDrawingMode();
        });
        
        // Preset pattern buttons - now work as drawing tool selectors
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectDrawingPattern(e.target.dataset.pattern);
            });
            
            // Add tooltip with pattern information
            const patternName = btn.dataset.pattern;
            const patternInfo = GameOfLifePatterns.getPatternInfo(patternName);
            if (patternInfo) {
                let tooltip = `${patternInfo.name}\nCategory: ${patternInfo.category}\n${patternInfo.description}`;
                if (patternInfo.period) tooltip += `\nPeriod: ${patternInfo.period}`;
                if (patternInfo.velocity) tooltip += `\nVelocity: ${patternInfo.velocity}`;
                if (patternInfo.lifespan) tooltip += `\nLifespan: ${patternInfo.lifespan} generations`;
                if (patternInfo.stabilization) tooltip += `\nStabilizes after: ${patternInfo.stabilization} generations`;
                
                btn.title = tooltip;
            }
        });
        
        // Quick action buttons
        document.getElementById('fillRandomBtn').addEventListener('click', () => {
            this.fillRandom();
        });
        
        document.getElementById('fillEdgesBtn').addEventListener('click', () => {
            this.fillEdges();
        });
        
        document.getElementById('fillCenterBtn').addEventListener('click', () => {
            this.fillCenter();
        });
        
        document.getElementById('invertBtn').addEventListener('click', () => {
            this.invertAll();
        });
        
        // Canvas interactions
        let isDrawing = false;
        let hasDragged = false;
        let drawingState = true; // true = drawing (making alive), false = erasing (making dead)
        
        // Canvas click for patterns (only when not in cell drawing mode)
        this.canvas.addEventListener('click', (e) => {
            if (!this.isRunning && !hasDragged && this.drawingMode !== 'cell') {
                this.placePatternAtClick(e);
            }
        });
        
        // Canvas mouse interactions for cell drawing
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.isRunning) {
                if (this.drawingMode === 'cell') {
                    isDrawing = true;
                    hasDragged = false;
                    
                    // Determine what we're doing based on the current cell state
                    const rect = this.canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const col = Math.floor(x / this.cellSize);
                    const row = Math.floor(y / this.cellSize);
                    
                    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                        // If cell is currently dead, we'll be drawing (making alive)
                        // If cell is currently alive, we'll be erasing (making dead)
                        drawingState = !this.grid[row][col];
                    }
                    
                    this.toggleCell(e);
                } else {
                    // For patterns, we'll handle on click to avoid interference
                    hasDragged = false;
                }
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (isDrawing && !this.isRunning && this.drawingMode === 'cell') {
                hasDragged = true;
                this.setCellToState(e, drawingState);
            } else if (!isDrawing && !this.isRunning && this.drawingMode !== 'cell') {
                // Track if mouse moved for pattern placement
                hasDragged = true;
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            isDrawing = false;
            // Reset hasDragged after a short delay to allow click event to fire
            setTimeout(() => { hasDragged = false; }, 10);
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            isDrawing = false;
            hasDragged = false;
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
            this.saveSettings();
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
            this.saveSettings();
        }
    }
    
    setCellToState(e, state) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.grid[row][col] = state;
            this.draw();
            this.updateInfo();
            this.saveSettings();
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
        
        // Get computed CSS custom properties for current theme
        const rootStyles = getComputedStyle(document.documentElement);
        const gridColor = rootStyles.getPropertyValue('--canvas-grid').trim();
        const cellColor = rootStyles.getPropertyValue('--canvas-cell').trim();
        
        // Draw grid
        this.ctx.strokeStyle = gridColor;
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
        this.ctx.fillStyle = cellColor;
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
        this.saveSettings();
    }
    
    randomize() {
        if (this.isRunning) return;
        
        // Use seeded random if seed is provided
        if (this.randomSeed !== null) {
            this.seedRandom(this.randomSeed);
        }
        
        const density = this.randomDensity / 100;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = Math.random() < density;
            }
        }
        this.generation = 0;
        this.draw();
        this.updateInfo();
        this.saveSettings();
    }
    
    // Seeded random number generator for reproducible patterns
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
    
    // Advanced control methods
    clearAll() {
        if (this.isRunning) return;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = false;
            }
        }
        this.generation = 0;
        this.draw();
        this.updateInfo();
        this.saveSettings();
    }
    
    applyGridSettings() {
        if (this.isRunning) {
            alert('Stop the simulation before changing grid settings.');
            return;
        }
        
        const newCols = parseInt(this.gridWidthSlider.value);
        const newRows = parseInt(this.gridHeightSlider.value);
        const newCellSize = parseInt(this.cellSizeSlider.value);
        
        // Update canvas size
        this.canvas.width = newCols * newCellSize;
        this.canvas.height = newRows * newCellSize;
        
        // Update grid properties
        this.cellSize = newCellSize;
        this.rows = newRows;
        this.cols = newCols;
        
        // Reinitialize grid
        this.initializeGrid();
        this.generation = 0;
        this.draw();
        this.updateInfo();
        this.saveSettings();
    }
    
    generateRandomSeed() {
        const seed = Math.floor(Math.random() * 1000000);
        this.randomSeedInput.value = seed;
        this.randomSeed = seed;
        this.saveSettings();
    }
    
    fillRandom() {
        this.randomize();
    }
    
    fillEdges() {
        if (this.isRunning) return;
        
        this.clearAll();
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (row === 0 || row === this.rows - 1 || col === 0 || col === this.cols - 1) {
                    this.grid[row][col] = Math.random() < 0.5;
                }
            }
        }
        this.draw();
        this.updateInfo();
        this.saveSettings();
    }
    
    fillCenter() {
        if (this.isRunning) return;
        
        this.clearAll();
        
        const centerRow = Math.floor(this.rows / 2);
        const centerCol = Math.floor(this.cols / 2);
        const radius = Math.min(this.rows, this.cols) / 6;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const distance = Math.sqrt((row - centerRow) ** 2 + (col - centerCol) ** 2);
                if (distance <= radius) {
                    this.grid[row][col] = Math.random() < 0.4;
                }
            }
        }
        this.draw();
        this.updateInfo();
        this.saveSettings();
    }
    
    invertAll() {
        if (this.isRunning) return;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = !this.grid[row][col];
            }
        }
        this.draw();
        this.updateInfo();
        this.saveSettings();
    }
    
    loadPreset(patternName) {
        if (this.isRunning) return;
        
        this.clearAll();
        
        const centerRow = Math.floor(this.rows / 2);
        const centerCol = Math.floor(this.cols / 2);
        
        const pattern = GameOfLifePatterns.getPattern(patternName);
        if (!pattern) return;
        
        const startRow = centerRow - Math.floor(pattern.length / 2);
        const startCol = centerCol - Math.floor(pattern[0].length / 2);
        
        for (let i = 0; i < pattern.length; i++) {
            for (let j = 0; j < pattern[i].length; j++) {
                const row = startRow + i;
                const col = startCol + j;
                if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                    this.grid[row][col] = pattern[i][j] === 1;
                }
            }
        }
        
        this.draw();
        this.updateInfo();
        this.saveSettings();
    }
    
    // Drawing tool methods
    selectDrawingPattern(patternName) {
        this.drawingMode = patternName;
        this.selectedPattern = this.getPatternData(patternName);
        this.updateDrawingModeUI();
        this.saveSettings();
    }
    
    selectCellDrawingMode() {
        this.drawingMode = 'cell';
        this.selectedPattern = null;
        this.updateDrawingModeUI();
        this.saveSettings();
    }
    
    placePatternAtClick(e) {
        if (!this.selectedPattern) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const clickCol = Math.floor(x / this.cellSize);
        const clickRow = Math.floor(y / this.cellSize);
        
        // Place pattern centered on click position
        const startRow = clickRow - Math.floor(this.selectedPattern.length / 2);
        const startCol = clickCol - Math.floor(this.selectedPattern[0].length / 2);
        
        for (let i = 0; i < this.selectedPattern.length; i++) {
            for (let j = 0; j < this.selectedPattern[i].length; j++) {
                const row = startRow + i;
                const col = startCol + j;
                if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                    if (this.selectedPattern[i][j] === 1) {
                        this.grid[row][col] = true;
                    }
                }
            }
        }
        
        this.draw();
        this.updateInfo();
        this.saveSettings();
    }
    
    getPatternData(patternName) {
        return GameOfLifePatterns.getPattern(patternName);
    }
    
    updateDrawingModeUI() {
        // Update button visual states
        document.querySelectorAll('.preset-btn').forEach(btn => {
            if (btn.dataset.pattern === this.drawingMode) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
        
        // Update cell drawing button if it exists
        const cellBtn = document.getElementById('cellDrawingBtn');
        if (cellBtn) {
            if (this.drawingMode === 'cell') {
                cellBtn.classList.add('selected');
            } else {
                cellBtn.classList.remove('selected');
            }
        }
        
        // Update cursor style based on drawing mode
        if (this.drawingMode === 'cell') {
            this.canvas.style.cursor = 'crosshair';
        } else {
            this.canvas.style.cursor = 'copy';
        }
    }
    
    // Sidebar methods
    toggleSidebar() {
        this.sidebar.classList.toggle('collapsed');
    }
    
    openMobileSidebar() {
        this.sidebar.classList.add('open');
        this.sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeMobileSidebar() {
        this.sidebar.classList.remove('open');
        this.sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Slider max value methods
    updateSliderMax(slider, maxValue) {
        const newMax = parseInt(maxValue);
        const currentValue = parseInt(slider.value);
        
        if (newMax >= currentValue && newMax > parseInt(slider.min)) {
            slider.max = newMax;
        } else if (newMax < currentValue) {
            // If new max is less than current value, set value to new max
            slider.max = newMax;
            slider.value = newMax;
            
            // Trigger input event to update display
            slider.dispatchEvent(new Event('input'));
        }
    }
    
    // Settings persistence methods
    saveSettings() {
        const settings = {
            // Game settings
            cellSize: this.cellSize,
            rows: this.rows,
            cols: this.cols,
            speed: this.speed,
            randomDensity: this.randomDensity,
            randomSeed: this.randomSeed,
            drawingMode: this.drawingMode,
            generation: this.generation,
            
            // UI settings
            gridWidth: this.gridWidthSlider.value,
            gridHeight: this.gridHeightSlider.value,
            
            // Slider max values
            speedMax: this.speedMax.value,
            gridWidthMax: this.gridWidthMax.value,
            gridHeightMax: this.gridHeightMax.value,
            cellSizeMax: this.cellSizeMax.value,
            randomDensityMax: this.randomDensityMax.value,
            
            // Grid state
            grid: this.grid.map(row => [...row]), // Deep copy
            
            // Sidebar state
            sidebarCollapsed: this.sidebar.classList.contains('collapsed'),
            
            // Timestamp for data validation
            timestamp: Date.now()
        };
        
        localStorage.setItem('gameoflife-settings', JSON.stringify(settings));
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('gameoflife-settings');
            if (!saved) return;
            
            const settings = JSON.parse(saved);
            
            // Validate settings age (don't load if older than 30 days)
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
            if (settings.timestamp && (Date.now() - settings.timestamp > maxAge)) {
                localStorage.removeItem('gameoflife-settings');
                return;
            }
            
            // Load game settings
            if (settings.speed !== undefined) {
                this.speed = settings.speed;
                this.speedSlider.value = settings.speed;
                this.speedValue.textContent = settings.speed;
            }
            
            if (settings.randomDensity !== undefined) {
                this.randomDensity = settings.randomDensity;
                this.randomDensitySlider.value = settings.randomDensity;
                this.randomDensityValue.textContent = settings.randomDensity + '%';
            }
            
            if (settings.randomSeed !== undefined) {
                this.randomSeed = settings.randomSeed;
                if (settings.randomSeed !== null) {
                    this.randomSeedInput.value = settings.randomSeed;
                }
            }
            
            // Load UI slider settings
            if (settings.gridWidth !== undefined) {
                this.gridWidthSlider.value = settings.gridWidth;
                this.gridWidthValue.textContent = settings.gridWidth;
            }
            
            if (settings.gridHeight !== undefined) {
                this.gridHeightSlider.value = settings.gridHeight;
                this.gridHeightValue.textContent = settings.gridHeight;
            }
            
            if (settings.cellSize !== undefined) {
                this.cellSizeSlider.value = settings.cellSize;
                this.cellSizeValue.textContent = settings.cellSize + 'px';
            }
            
            // Load slider max values
            if (settings.speedMax !== undefined) {
                this.speedMax.value = settings.speedMax;
                this.speedSlider.max = settings.speedMax;
            }
            
            if (settings.gridWidthMax !== undefined) {
                this.gridWidthMax.value = settings.gridWidthMax;
                this.gridWidthSlider.max = settings.gridWidthMax;
            }
            
            if (settings.gridHeightMax !== undefined) {
                this.gridHeightMax.value = settings.gridHeightMax;
                this.gridHeightSlider.max = settings.gridHeightMax;
            }
            
            if (settings.cellSizeMax !== undefined) {
                this.cellSizeMax.value = settings.cellSizeMax;
                this.cellSizeSlider.max = settings.cellSizeMax;
            }
            
            if (settings.randomDensityMax !== undefined) {
                this.randomDensityMax.value = settings.randomDensityMax;
                this.randomDensitySlider.max = settings.randomDensityMax;
            }
            
            // Load grid settings (if they're different from defaults)
            if (settings.cellSize !== undefined && 
                (settings.cellSize !== this.cellSize || 
                 settings.rows !== this.rows || 
                 settings.cols !== this.cols)) {
                
                // Update canvas size
                this.canvas.width = settings.cols * settings.cellSize;
                this.canvas.height = settings.rows * settings.cellSize;
                
                // Update grid properties
                this.cellSize = settings.cellSize;
                this.rows = settings.rows;
                this.cols = settings.cols;
                
                // Initialize grid with new dimensions
                this.initializeGrid();
            }
            
            // Load grid state
            if (settings.grid && Array.isArray(settings.grid) && 
                settings.grid.length === this.rows) {
                this.grid = settings.grid.map(row => [...row]); // Deep copy
                this.generation = settings.generation || 0;
            }
            
            // Load drawing mode
            if (settings.drawingMode !== undefined) {
                if (settings.drawingMode === 'cell') {
                    this.selectCellDrawingMode();
                } else {
                    this.selectDrawingPattern(settings.drawingMode);
                }
            }
            
            // Load sidebar state
            if (settings.sidebarCollapsed) {
                this.sidebar.classList.add('collapsed');
            }
            
        } catch (error) {
            console.warn('Failed to load saved settings:', error);
            // Clear corrupted data
            localStorage.removeItem('gameoflife-settings');
        }
    }
    
    // Dark mode methods
    initializeDarkMode() {
        // Check localStorage for saved theme preference
        const savedTheme = localStorage.getItem('gameoflife-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Set initial theme
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            this.setDarkMode(true);
        } else {
            this.setDarkMode(false);
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('gameoflife-theme')) {
                this.setDarkMode(e.matches);
            }
        });
    }
    
    toggleDarkMode() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        this.setDarkMode(!isDark);
    }
    
    setDarkMode(isDark) {
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('gameoflife-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('gameoflife-theme', 'light');
        }
        
        // Update toggle icon
        this.updateDarkModeIcon(isDark);
        
        // Redraw canvas with new colors
        this.draw();
    }
    
    updateDarkModeIcon(isDark) {
        const icon = this.darkModeToggle.querySelector('.toggle-icon');
        if (isDark) {
            icon.textContent = '☀️';
        } else {
            icon.textContent = '🌙';
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new GameOfLife('gameCanvas');
    
    // Add a glider pattern in the middle for demo (only if no saved settings exist)
    const hasSavedSettings = localStorage.getItem('gameoflife-settings');
    if (!hasSavedSettings) {
        setTimeout(() => {
            const startRow = Math.floor(game.rows / 2);
            const startCol = Math.floor(game.cols / 2);
            
            const pattern = GameOfLifePatterns.getPattern('glider');
            if (pattern) {
                for (let i = 0; i < pattern.length; i++) {
                    for (let j = 0; j < pattern[i].length; j++) {
                        if (startRow + i < game.rows && startCol + j < game.cols) {
                            game.grid[startRow + i][startCol + j] = pattern[i][j] === 1;
                        }
                    }
                }
                
                game.draw();
                game.updateInfo();
                game.saveSettings(); // Save initial demo state
            }
        }, 100);
    }
});
