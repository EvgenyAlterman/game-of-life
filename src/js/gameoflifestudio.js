import { GameOfLifePatterns } from './patterns.js';
import { GameOfLifeEngine } from './game-engine.js';

class GameOfLifeStudio {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Grid dimensions
        this.cellSize = 10;
        this.rows = Math.floor(this.canvas.height / this.cellSize);
        this.cols = Math.floor(this.canvas.width / this.cellSize);
        
        // Game engine
        this.engine = new GameOfLifeEngine(this.rows, this.cols);
        
        // UI state
        this.isRunning = false;
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
        this.gridToggle = document.getElementById('gridToggle');
        this.fadeToggle = document.getElementById('fadeToggle');
        this.fadeSettings = document.getElementById('fadeSettings');
        this.fadeSlider = document.getElementById('fadeSlider');
        this.fadeValue = document.getElementById('fadeValue');
        this.fadeMax = document.getElementById('fadeMax');
        this.maturityToggle = document.getElementById('maturityToggle');
        this.maturitySettings = document.getElementById('maturitySettings');
        this.maturityColor = document.getElementById('maturityColor');
        this.recordBtn = document.getElementById('recordBtn');
        this.finishBtn = document.getElementById('finishBtn');
        this.generationDisplay = document.getElementById('generation');
        this.populationDisplay = document.getElementById('population');
        
        // Timeline elements
        this.timelineSection = document.getElementById('timelineSection');
        this.playTimelineBtn = document.getElementById('playTimelineBtn');
        this.pauseTimelineBtn = document.getElementById('pauseTimelineBtn');
        this.stopTimelineBtn = document.getElementById('stopTimelineBtn');
        this.timelineSlider = document.getElementById('timelineSlider');
        this.currentFrame = document.getElementById('currentFrame');
        this.totalFrames = document.getElementById('totalFrames');
        this.playbackSpeed = document.getElementById('playbackSpeed');
        this.speedValue = document.getElementById('speedValue');
        
        // Recording management elements
        this.recordingsSection = document.getElementById('recordingsSection');
        this.loadRecordingsBtn = document.getElementById('loadRecordingsBtn');
        this.recordingsList = document.getElementById('recordingsList');
        
        // Modal elements
        this.saveModal = document.getElementById('saveModal');
        this.modalClose = document.getElementById('modalClose');
        this.recordingName = document.getElementById('recordingName');
        this.recordedGenerationsSpan = document.getElementById('recordedGenerations');
        this.recordingDuration = document.getElementById('recordingDuration');
        this.cancelSave = document.getElementById('cancelSave');
        this.confirmSave = document.getElementById('confirmSave');
        
        // Pattern tree elements
        this.patternSearch = document.getElementById('patternSearch');
        this.patternTree = document.getElementById('patternTree');
        this.searchResults = document.getElementById('searchResults');
        
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
        
        // Pattern preview settings
        this.previewPosition = null; // {row, col} or null
        this.showPreview = false;
        this.patternRotation = 0; // 0, 90, 180, 270 degrees
        
        // Grid display settings
        this.showGrid = false;
        
        // Fade/ghost trail settings
        this.fadeMode = false;
        this.fadeDuration = 1;
        
        // Maturity settings
        this.maturityMode = false;
        this.maturityEndColor = '#4c1d95'; // Deep violet default color
        
        // Inspector settings
        this.inspectorMode = false;
        this.tooltip = null;
        
        // Recording settings
        this.isRecording = false;
        this.recordedGenerations = [];
        this.recordingStartTime = null;
        
        // Timeline settings
        this.isReplaying = false;
        this.replayData = null;
        this.replayIndex = 0;
        this.replaySpeed = 5;
        this.replayInterval = null;
        
        // Initial state for reset functionality
        this.initialState = null;
        
        this.setupEventListeners();
        this.initializeDarkMode();
        this.loadSettings();
        this.draw();
        this.updateInfo();
        this.updateDrawingModeUI();
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
        
        // Grid toggle
        this.gridToggle.addEventListener('click', () => {
            this.toggleGrid();
        });
        
        // Fade toggle
        this.fadeToggle.addEventListener('click', () => {
            this.toggleFadeMode();
        });
        
        // Fade duration slider
        this.fadeSlider.addEventListener('input', (e) => {
            this.fadeDuration = parseInt(e.target.value);
            this.fadeValue.textContent = this.fadeDuration;
            this.saveSettings();
        });
        
        // Maturity toggle
        this.maturityToggle.addEventListener('click', () => {
            this.toggleMaturityMode();
        });
        
        // Maturity color picker
        this.maturityColor.addEventListener('input', (e) => {
            this.maturityEndColor = e.target.value;
            this.updateColorLabel();
            this.draw(); // Redraw to show new colors
            this.saveSettings();
        });
        
        // Fade max value
        this.fadeMax.addEventListener('input', (e) => {
            this.updateSliderMax(this.fadeSlider, e.target.value);
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
        
        // Cell inspector button
        document.getElementById('cellInspectorBtn').addEventListener('click', () => {
            this.selectInspectorMode();
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
        
        // Canvas click for patterns (only when not in cell drawing mode and not in inspector mode)
        this.canvas.addEventListener('click', (e) => {
            if (!this.isRunning && this.drawingMode !== 'cell' && !this.inspectorMode) {
                this.placePatternAtClick(e);
            }
        });
        
        // Canvas mouse interactions for cell drawing
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.isRunning && this.drawingMode === 'cell') {
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
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (isDrawing && !this.isRunning && this.drawingMode === 'cell') {
                hasDragged = true;
                this.setCellToState(e, drawingState);
            } else if (!this.isRunning && this.drawingMode !== 'cell' && this.selectedPattern && !this.inspectorMode) {
                // Show pattern preview
                this.updatePatternPreview(e);
            } else if (this.inspectorMode) {
                // Show inspector tooltip
                this.updateInspectorTooltip(e);
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            isDrawing = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            isDrawing = false;
            this.clearPatternPreview();
            this.hideInspectorTooltip();
        });
        
        // Keyboard controls for pattern rotation
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning && this.drawingMode !== 'cell' && this.selectedPattern) {
                if (e.key === '[') {
                    e.preventDefault();
                    this.rotatePatternLeft();
                } else if (e.key === ']') {
                    e.preventDefault();
                    this.rotatePatternRight();
                }
            }
        });
        
        // Recording controls
        this.recordBtn.addEventListener('click', () => {
            this.toggleRecording();
        });
        
        this.finishBtn.addEventListener('click', () => {
            this.finishRecording();
        });
        
        // Timeline controls
        this.playTimelineBtn.addEventListener('click', () => {
            this.playTimeline();
        });
        
        this.pauseTimelineBtn.addEventListener('click', () => {
            this.pauseTimeline();
        });
        
        this.stopTimelineBtn.addEventListener('click', () => {
            this.stopTimeline();
        });
        
        this.timelineSlider.addEventListener('input', (e) => {
            this.seekTimeline(parseInt(e.target.value));
        });
        
        this.playbackSpeed.addEventListener('input', (e) => {
            this.replaySpeed = parseInt(e.target.value);
            this.speedValue.textContent = e.target.value + 'x';
        });
        
        // Recording management
        this.loadRecordingsBtn.addEventListener('click', () => {
            this.loadRecordings();
        });
        
        // Modal controls
        this.modalClose.addEventListener('click', () => {
            this.closeModal();
        });
        
        this.cancelSave.addEventListener('click', () => {
            this.closeModal();
        });
        
        this.confirmSave.addEventListener('click', () => {
            this.saveRecording();
        });
        
        // Close modal on overlay click
        this.saveModal.addEventListener('click', (e) => {
            if (e.target === this.saveModal) {
                this.closeModal();
            }
        });
        
        // Pattern search
        this.patternSearch.addEventListener('input', (e) => {
            this.handlePatternSearch(e.target.value);
        });
        
        // Clear search on ESC
        this.patternSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearPatternSearch();
            }
        });
    }
    
    toggleCell(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.engine.toggleCell(row, col);
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
            this.engine.setCell(row, col, true);
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
            this.engine.setCell(row, col, state);
            this.draw();
            this.updateInfo();
            this.saveSettings();
        }
    }
    
    toggleSimulation() {
        this.isRunning = !this.isRunning;
        
        const playIcon = this.startStopBtn.querySelector('.btn-icon');
        
        if (this.isRunning) {
            // Capture initial state when starting simulation
            this.captureInitialState();
            
            playIcon.setAttribute('data-lucide', 'pause');
            this.startStopBtn.title = 'Pause Simulation';
            lucide.createIcons();
            this.animate(0);
        } else {
            playIcon.setAttribute('data-lucide', 'play');
            this.startStopBtn.title = 'Start Simulation';
            lucide.createIcons();
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
        // Update game engine
        const result = this.engine.updateGeneration();
        
        // Update fade effects if fade mode is enabled
        if (this.fadeMode) {
            this.engine.updateFadeGrid(this.fadeDuration);
        }
        
        // Record generation if recording is active
        if (this.isRecording) {
            this.recordGeneration();
        }
        
        this.draw();
        this.updateInfo();
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
                if (this.engine.getCell(row, col)) {
                    this.ctx.fillRect(
                        col * this.cellSize + 1,
                        row * this.cellSize + 1,
                        this.cellSize - 2,
                        this.cellSize - 2
                    );
                }
            }
        }
        
        // Draw fading cells if fade mode is enabled
        if (this.fadeMode) {
            this.drawFadingCells(cellColor);
        }
        
        // Draw mature cells if maturity mode is enabled
        if (this.maturityMode) {
            this.drawMatureCells();
        }
        
        // Draw grid overlay (every 5 cells with thicker lines)
        if (this.showGrid) {
            this.drawGridOverlay();
        }
        
        // Draw pattern preview
        this.drawPatternPreview();
    }
    
    reset() {
        this.isRunning = false;
        
        const playIcon = this.startStopBtn.querySelector('.btn-icon');
        playIcon.setAttribute('data-lucide', 'play');
        this.startStopBtn.title = 'Start Simulation';
        lucide.createIcons();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Restore to initial state if available, otherwise clear grid
        if (this.initialState) {
            this.restoreInitialState();
        } else {
            this.engine.clear();
        }
        
        this.draw();
        this.updateInfo();
        this.saveSettings();
    }
    
    // Initial state management for reset functionality
    captureInitialState() {
        // Capture full engine state
        this.initialState = this.engine.getGridSnapshot();
    }
    
    restoreInitialState() {
        if (!this.initialState) return;
        
        // Restore full engine state
        this.engine.restoreFromSnapshot(this.initialState);
    }
    
    randomize() {
        if (this.isRunning) return;
        
        const density = this.randomDensity / 100;
        
        // Use engine's randomize method
        this.engine.randomize(density, this.randomSeed);
        
        // Clear initial state since user is generating a new random pattern
        this.initialState = null;
        
        this.draw();
        this.updateInfo();
        this.saveSettings();
    }
    
    updateInfo() {
        this.generationDisplay.textContent = this.engine.generation;
        this.populationDisplay.textContent = this.engine.getPopulation();
    }
    
    // Advanced control methods
    clearAll() {
        if (this.isRunning) return;
        
        // Use engine's clear method
        this.engine.clear();
        
        // Clear initial state since user is starting fresh
        this.initialState = null;
        
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
        
        // Resize engine
        this.engine.resize(newRows, newCols);
        
        // Clear initial state since grid dimensions changed
        this.initialState = null;
        
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
        
        this.engine.fillEdges(0.5);
        this.draw();
        this.updateInfo();
        this.saveSettings();
    }
    
    fillCenter() {
        if (this.isRunning) return;
        
        this.engine.fillCenter(0.4);
        this.draw();
        this.updateInfo();
        this.saveSettings();
    }
    
    invertAll() {
        if (this.isRunning) return;
        
        this.engine.invert();
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
        
        this.engine.placePattern(pattern, centerRow, centerCol);
        
        this.draw();
        this.updateInfo();
        this.saveSettings();
    }
    
    // Drawing tool methods
    selectDrawingPattern(patternName) {
        this.drawingMode = patternName;
        this.inspectorMode = false;
        this.selectedPattern = this.getPatternData(patternName);
        this.patternRotation = 0; // Reset rotation when selecting new pattern
        this.updateDrawingModeUI();
        this.clearPatternPreview(); // Clear any existing preview
        this.hideInspectorTooltip();
        this.updatePatternHints(); // Show pattern controls
        this.saveSettings();
    }
    
    selectCellDrawingMode() {
        this.drawingMode = 'cell';
        this.inspectorMode = false;
        this.selectedPattern = null;
        this.patternRotation = 0; // Reset rotation
        this.clearPatternPreview(); // Clear any existing preview
        this.hideInspectorTooltip();
        this.updateDrawingModeUI();
        this.updatePatternHints(); // Hide pattern controls
        this.saveSettings();
    }
    
    placePatternAtClick(e) {
        if (!this.selectedPattern) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const clickCol = Math.floor(x / this.cellSize);
        const clickRow = Math.floor(y / this.cellSize);
        
        // Get the rotated pattern
        const rotatedPattern = this.getRotatedPattern(this.selectedPattern, this.patternRotation);
        
        // Place pattern using engine
        this.engine.placePattern(rotatedPattern, clickRow, clickCol);
        
        this.clearPatternPreview(); // Clear preview after placing
        this.draw();
        this.updateInfo();
        this.saveSettings();
    }
    
    // Pattern preview methods
    updatePatternPreview(e) {
        if (!this.selectedPattern) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        // Only update if position has changed
        if (!this.previewPosition || 
            this.previewPosition.row !== row || 
            this.previewPosition.col !== col) {
            
            this.previewPosition = { row, col };
            this.showPreview = true;
            
            // Redraw to show the preview
            this.draw();
        }
    }
    
    clearPatternPreview() {
        if (this.showPreview) {
            this.showPreview = false;
            this.previewPosition = null;
            this.draw(); // Redraw to clear the preview
        }
    }
    
    drawPatternPreview() {
        if (!this.showPreview || !this.previewPosition || !this.selectedPattern) return;
        
        // Get preview colors (semi-transparent version of cell color)
        const rootStyles = getComputedStyle(document.documentElement);
        const cellColor = rootStyles.getPropertyValue('--canvas-cell').trim();
        
        // Create semi-transparent color
        this.ctx.fillStyle = this.hexToRgba(cellColor, 0.3); // 30% opacity
        
        const centerRow = this.previewPosition.row;
        const centerCol = this.previewPosition.col;
        
        // Get the rotated pattern
        const rotatedPattern = this.getRotatedPattern(this.selectedPattern, this.patternRotation);
        
        // Calculate pattern placement (same logic as placePatternAtClick)
        const startRow = centerRow - Math.floor(rotatedPattern.length / 2);
        const startCol = centerCol - Math.floor(rotatedPattern[0].length / 2);
        
        // Draw preview pattern
        for (let i = 0; i < rotatedPattern.length; i++) {
            for (let j = 0; j < rotatedPattern[i].length; j++) {
                const row = startRow + i;
                const col = startCol + j;
                
                if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                    if (rotatedPattern[i][j] === 1) {
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
    }
    
    // Helper method to convert hex color to rgba
    hexToRgba(hex, alpha) {
        // Handle CSS color variables and hex colors
        if (hex.includes('rgb')) {
            // If it's already rgb, just add alpha
            return hex.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
        }
        
        // Convert hex to rgba
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        
        // Fallback for unknown formats
        return `rgba(66, 153, 225, ${alpha})`; // Default blue with alpha
    }
    
    // Pattern rotation methods
    rotatePatternLeft() {
        this.patternRotation = (this.patternRotation - 90 + 360) % 360;
        this.draw(); // Redraw to show rotated preview
    }
    
    rotatePatternRight() {
        this.patternRotation = (this.patternRotation + 90) % 360;
        this.draw(); // Redraw to show rotated preview
    }
    
    // Get pattern rotated by specified degrees (0, 90, 180, 270)
    getRotatedPattern(pattern, degrees) {
        if (!pattern || degrees === 0) return pattern;
        
        let rotated = pattern;
        const times = (degrees / 90) % 4;
        
        for (let i = 0; i < times; i++) {
            rotated = this.rotatePatternMatrix90(rotated);
        }
        
        return rotated;
    }
    
    // Rotate pattern matrix 90 degrees clockwise
    rotatePatternMatrix90(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = [];
        
        // Create new matrix with swapped dimensions
        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = matrix[rows - 1 - j][i];
            }
        }
        
        return rotated;
    }
    
    // Update pattern hints UI
    updatePatternHints() {
        let hintsContainer = document.querySelector('.pattern-hints');
        
        if (this.inspectorMode) {
            // Show inspector hints
            if (!hintsContainer) {
                hintsContainer = document.createElement('div');
                hintsContainer.className = 'pattern-hints';
                document.querySelector('.info').appendChild(hintsContainer);
            }
            
            hintsContainer.innerHTML = `
                <div class="pattern-hint-content">
                    <span class="pattern-name">Cell Inspector</span>
                    <span class="pattern-controls">
                        hover over cells to see maturity information
                    </span>
                </div>
            `;
            hintsContainer.style.display = 'block';
        } else if (this.drawingMode !== 'cell' && this.selectedPattern) {
            // Show pattern hints
            if (!hintsContainer) {
                hintsContainer = document.createElement('div');
                hintsContainer.className = 'pattern-hints';
                document.querySelector('.info').appendChild(hintsContainer);
            }
            
            const patternInfo = GameOfLifePatterns.getPatternInfo(this.drawingMode);
            const patternName = patternInfo ? patternInfo.name : this.drawingMode;
            
            hintsContainer.innerHTML = `
                <div class="pattern-hint-content">
                    <span class="pattern-name">${patternName}</span>
                    <span class="pattern-controls">
                        <kbd>[</kbd> rotate left • <kbd>]</kbd> rotate right • click to place
                    </span>
                </div>
            `;
            hintsContainer.style.display = 'block';
        } else {
            // Hide hints
            if (hintsContainer) {
                hintsContainer.style.display = 'none';
            }
        }
    }
    
    // Grid overlay methods
    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.updateGridUI();
        this.draw(); // Redraw to show/hide grid
        this.saveSettings();
    }
    
    updateGridUI() {
        const gridText = this.gridToggle.querySelector('span');
        if (this.showGrid) {
            this.gridToggle.classList.add('selected');
            gridText.textContent = 'Hide Grid';
        } else {
            this.gridToggle.classList.remove('selected');
            gridText.textContent = 'Show Grid';
        }
    }
    
    drawGridOverlay() {
        // Get theme-appropriate grid color
        const rootStyles = getComputedStyle(document.documentElement);
        const gridColor = rootStyles.getPropertyValue('--canvas-grid').trim();
        
        // Create a darker/more visible grid color
        let overlayColor;
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
            overlayColor = this.hexToRgba(gridColor, 0.6);
        } else {
            // Fallback
            overlayColor = 'rgba(128, 128, 128, 0.6)';
        }
        
        this.ctx.strokeStyle = overlayColor;
        this.ctx.lineWidth = 2;
        
        // Draw thicker vertical lines every 5 cells
        for (let col = 0; col <= this.cols; col += 5) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.cellSize, 0);
            this.ctx.lineTo(col * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw thicker horizontal lines every 5 cells
        for (let row = 0; row <= this.rows; row += 5) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.cellSize);
            this.ctx.lineTo(this.canvas.width, row * this.cellSize);
            this.ctx.stroke();
        }
        
        // Reset line width
        this.ctx.lineWidth = 1;
    }
    
    // Fade mode methods
    toggleFadeMode() {
        this.fadeMode = !this.fadeMode;
        this.updateFadeUI();
        
        // Clear existing fade grid when toggling mode
        if (!this.fadeMode) {
            this.engine.clearStateTracking();
        }
        
        this.draw(); // Redraw to show/hide fade effects
        this.saveSettings();
    }
    
    updateFadeUI() {
        if (this.fadeMode) {
            this.fadeToggle.classList.add('active');
            this.fadeToggle.querySelector('span').textContent = 'Ghost Trail ON';
            this.fadeSettings.style.display = 'block';
        } else {
            this.fadeToggle.classList.remove('active');
            this.fadeToggle.querySelector('span').textContent = 'Ghost Trail';
            this.fadeSettings.style.display = 'none';
        }
    }
    
    drawFadingCells(baseCellColor) {
        // Convert cell color to rgba for transparency
        const baseColor = this.hexToRgba(baseCellColor, 1.0);
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const fadeLevel = this.engine.getCellFadeLevel(row, col);
                const isAlive = this.engine.getCell(row, col);
                
                if (fadeLevel > 0 && !isAlive) {
                    // Calculate opacity based on fade level (higher = more opaque)
                    const opacity = fadeLevel / this.fadeDuration * 0.8; // Max 80% opacity
                    const fadeColor = this.hexToRgba(baseCellColor, opacity);
                    
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
    
    // Maturity mode methods
    toggleMaturityMode() {
        this.maturityMode = !this.maturityMode;
        this.updateMaturityUI();
        
        // Clear existing maturity grid when toggling mode
        if (!this.maturityMode) {
            this.engine.clearStateTracking();
        }
        
        this.draw(); // Redraw to show/hide maturity effects
        this.saveSettings();
    }
    
    updateMaturityUI() {
        if (this.maturityMode) {
            this.maturityToggle.classList.add('active');
            this.maturityToggle.querySelector('span').textContent = 'Maturity ON';
            this.maturitySettings.style.display = 'block';
        } else {
            this.maturityToggle.classList.remove('active');
            this.maturityToggle.querySelector('span').textContent = 'Maturity Mode';
            this.maturitySettings.style.display = 'none';
        }
    }
    
    updateColorLabel() {
        const colorLabel = document.querySelector('.color-label');
        const colorName = this.getColorName(this.maturityEndColor);
        colorLabel.textContent = colorName;
    }
    
    getColorName(hexColor) {
        // Convert hex to a readable color name
        const colorMap = {
            '#4c1d95': 'Deep Violet',
            '#7c3aed': 'Purple',
            '#8b5cf6': 'Light Purple',
            '#dc2626': 'Red',
            '#ea580c': 'Orange',
            '#ca8a04': 'Yellow',
            '#16a34a': 'Green',
            '#0ea5e9': 'Blue',
            '#e11d48': 'Pink',
            '#9333ea': 'Violet',
            '#000000': 'Black',
            '#ffffff': 'White'
        };
        
        return colorMap[hexColor.toLowerCase()] || 'Custom';
    }
    
    drawMatureCells() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const isAlive = this.engine.getCell(row, col);
                const maturity = this.engine.getCellMaturity(row, col);
                
                if (isAlive && maturity > 0) {
                    // Generate violet color based on maturity
                    const maturityColor = this.getMaturityColor(maturity);
                    
                    this.ctx.fillStyle = maturityColor;
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
    
    getMaturityColor(maturity) {
        // Cap maturity at 20 for color calculation
        const cappedMaturity = Math.min(maturity, 20);
        
        // Calculate color intensity (0 to 1)
        const intensity = cappedMaturity / 20;
        
        // Create a gradient from light blue to selected end color
        const startColor = { r: 144, g: 205, b: 244 }; // Light blue
        const endColor = this.hexToRgb(this.maturityEndColor);
        
        const r = Math.round(startColor.r + (endColor.r - startColor.r) * intensity);
        const g = Math.round(startColor.g + (endColor.g - startColor.g) * intensity);
        const b = Math.round(startColor.b + (endColor.b - startColor.b) * intensity);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    hexToRgb(hex) {
        // Convert hex color to RGB object
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 76, g: 29, b: 149 }; // Default to deep violet if parsing fails
    }
    
    // Inspector mode methods
    selectInspectorMode() {
        this.drawingMode = 'inspector';
        this.inspectorMode = true;
        this.selectedPattern = null;
        this.patternRotation = 0;
        this.clearPatternPreview();
        this.updateDrawingModeUI();
        this.updatePatternHints();
        this.createInspectorTooltip();
        this.saveSettings();
    }
    
    createInspectorTooltip() {
        // Remove existing tooltip
        this.hideInspectorTooltip();
        
        // Create new tooltip element
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'cell-inspector-tooltip';
        document.body.appendChild(this.tooltip);
    }
    
    updateInspectorTooltip(e) {
        if (!this.tooltip) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        // Check if coordinates are within grid bounds
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            const isAlive = this.engine.getCell(row, col);
            const maturity = this.engine.getCellMaturity(row, col);
            const deadTime = this.engine.getCellDeadTime(row, col);
            
            let tooltipContent = `
                <div class="tooltip-cell-info">
                    <span class="tooltip-label">Position:</span> 
                    <span class="tooltip-value">(${col}, ${row})</span>
                </div>
                <div class="tooltip-cell-info">
                    <span class="tooltip-label">State:</span> 
                    <span class="tooltip-value">${isAlive ? 'Alive' : 'Dead'}</span>
                </div>
            `;
            
            if (isAlive) {
                tooltipContent += `
                    <div class="tooltip-cell-info">
                        <span class="tooltip-label">Alive for:</span> 
                        <span class="tooltip-value">${maturity + 1} generation${maturity === 0 ? '' : 's'}</span>
                    </div>
                `;
            } else {
                tooltipContent += `
                    <div class="tooltip-cell-info">
                        <span class="tooltip-label">Dead for:</span> 
                        <span class="tooltip-value">${deadTime + 1} generation${deadTime === 0 ? '' : 's'}</span>
                    </div>
                `;
            }
            
            // Show tooltip
            this.tooltip.innerHTML = tooltipContent;
            this.tooltip.style.left = (e.clientX) + 'px';
            this.tooltip.style.top = (e.clientY - 10) + 'px';
            this.tooltip.classList.add('show');
        } else {
            this.hideInspectorTooltip();
        }
    }
    
    hideInspectorTooltip() {
        if (this.tooltip) {
            this.tooltip.classList.remove('show');
            // Clean up tooltip when not in inspector mode
            if (!this.inspectorMode) {
                this.tooltip.remove();
                this.tooltip = null;
            }
        }
    }
    
    getPatternData(patternName) {
        return GameOfLifePatterns.getPattern(patternName);
    }
    
    // Recording functionality
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    startRecording() {
        if (this.isReplaying) {
            this.stopTimeline();
        }
        
        this.isRecording = true;
        this.recordedGenerations = [];
        this.recordingStartTime = Date.now();
        
        // Record initial state
        this.recordGeneration();
        
        // Update UI
        this.recordBtn.classList.add('recording');
        this.recordBtn.title = 'Stop Recording';
        this.finishBtn.style.display = 'inline-block';
        
        console.log('🔴 Recording started');
    }
    
    stopRecording() {
        this.isRecording = false;
        
        // Update UI
        this.recordBtn.classList.remove('recording');
        this.recordBtn.title = 'Start Recording';
        
        console.log(`🔴 Recording stopped. ${this.recordedGenerations.length} generations recorded.`);
    }
    
    finishRecording() {
        if (!this.isRecording || this.recordedGenerations.length === 0) {
            alert('No recording to save!');
            return;
        }
        
        this.stopRecording();
        this.finishBtn.style.display = 'none';
        
        // Show timeline and set up data
        this.replayData = [...this.recordedGenerations]; // Copy array
        this.setupTimeline();
        
        // Show save modal
        this.showSaveModal();
    }
    
    recordGeneration() {
        const generationData = {
            generation: this.engine.generation,
            grid: this.engine.getGridSnapshot().grid, // Use engine's grid
            population: this.engine.getPopulation(),
            timestamp: Date.now() - this.recordingStartTime
        };
        
        this.recordedGenerations.push(generationData);
    }
    
    // Timeline functionality
    setupTimeline() {
        if (!this.replayData || this.replayData.length === 0) return;
        
        this.timelineSection.style.display = 'block';
        this.timelineSlider.max = this.replayData.length - 1;
        this.timelineSlider.value = 0;
        this.totalFrames.textContent = this.replayData.length;
        this.currentFrame.textContent = 1;
        this.replayIndex = 0;
        
        // Load first frame
        this.loadTimelineFrame(0);
    }
    
    playTimeline() {
        if (!this.replayData || this.replayData.length === 0) return;
        
        if (this.isRunning) {
            this.toggleSimulation(); // Stop normal simulation
        }
        
        this.isReplaying = true;
        this.playTimelineBtn.style.display = 'none';
        this.pauseTimelineBtn.style.display = 'inline-block';
        
        // Calculate interval based on speed (higher speed = shorter interval)
        const interval = Math.max(50, 1000 / this.replaySpeed);
        
        this.replayInterval = setInterval(() => {
            if (this.replayIndex < this.replayData.length - 1) {
                this.replayIndex++;
                this.loadTimelineFrame(this.replayIndex);
                this.timelineSlider.value = this.replayIndex;
                this.currentFrame.textContent = this.replayIndex + 1;
            } else {
                this.pauseTimeline();
            }
        }, interval);
    }
    
    pauseTimeline() {
        this.isReplaying = false;
        if (this.replayInterval) {
            clearInterval(this.replayInterval);
            this.replayInterval = null;
        }
        
        this.playTimelineBtn.style.display = 'inline-block';
        this.pauseTimelineBtn.style.display = 'none';
    }
    
    stopTimeline() {
        this.pauseTimeline();
        this.replayIndex = 0;
        this.timelineSlider.value = 0;
        this.currentFrame.textContent = 1;
        
        if (this.replayData && this.replayData.length > 0) {
            this.loadTimelineFrame(0);
        }
    }
    
    seekTimeline(frameIndex) {
        if (!this.replayData || frameIndex < 0 || frameIndex >= this.replayData.length) return;
        
        this.replayIndex = frameIndex;
        this.currentFrame.textContent = frameIndex + 1;
        this.loadTimelineFrame(frameIndex);
    }
    
    loadTimelineFrame(frameIndex) {
        if (!this.replayData || frameIndex < 0 || frameIndex >= this.replayData.length) return;
        
        const frame = this.replayData[frameIndex];
        
        // Update engine's grid directly
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (frame.grid[row] && frame.grid[row][col] !== undefined) {
                    this.engine.setCell(row, col, frame.grid[row][col]);
                }
            }
        }
        this.engine.generation = frame.generation;
        
        this.draw();
        this.updateInfo();
    }
    
    // Modal functionality
    showSaveModal() {
        const duration = this.recordingStartTime ? 
            Math.floor((Date.now() - this.recordingStartTime) / 1000) : 0;
        
        this.recordedGenerationsSpan.textContent = this.recordedGenerations.length;
        this.recordingDuration.textContent = duration + 's';
        this.recordingName.value = `Recording ${new Date().toLocaleString()}`;
        
        this.saveModal.style.display = 'flex';
        this.recordingName.focus();
        this.recordingName.select();
    }
    
    closeModal() {
        this.saveModal.style.display = 'none';
        this.recordingName.value = '';
    }
    
    async saveRecording() {
        const name = this.recordingName.value.trim();
        if (!name) {
            alert('Please enter a recording name!');
            return;
        }
        
        if (!this.recordedGenerations || this.recordedGenerations.length === 0) {
            alert('No recording data to save!');
            return;
        }
        
        try {
            const recordingData = {
                generations: this.recordedGenerations,
                settings: {
                    cellSize: this.cellSize,
                    rows: this.rows,
                    cols: this.cols,
                    speed: this.speed
                }
            };
            
            const response = await fetch('/api/recordings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    data: recordingData
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert(`Recording "${name}" saved successfully!`);
                this.closeModal();
                this.loadRecordings(); // Refresh the recordings list
            } else {
                throw new Error(result.error || 'Failed to save recording');
            }
            
        } catch (error) {
            console.error('Error saving recording:', error);
            alert('Failed to save recording: ' + error.message);
        }
    }
    
    // Recording management
    async loadRecordings() {
        try {
            const response = await fetch('/api/recordings');
            const recordings = await response.json();
            
            this.displayRecordings(recordings);
            
        } catch (error) {
            console.error('Error loading recordings:', error);
            this.recordingsList.innerHTML = '<p class="no-recordings">Failed to load recordings</p>';
        }
    }
    
    displayRecordings(recordings) {
        if (!recordings || recordings.length === 0) {
            this.recordingsList.innerHTML = '<p class="no-recordings">No recordings available. Start recording to save your simulations!</p>';
            return;
        }
        
        this.recordingsList.innerHTML = recordings.map(recording => `
            <div class="recording-item">
                <div class="recording-info">
                    <div class="recording-name">${recording.name}</div>
                    <div class="recording-details">
                        ${recording.totalGenerations} generations • ${recording.date} ${recording.time}
                    </div>
                </div>
                <div class="recording-actions">
                    <button class="play-recording-btn" onclick="game.playRecording('${recording.id}')">
                        <i data-lucide="play" style="width: 12px; height: 12px;"></i>
                        Play
                    </button>
                    <button class="delete-recording-btn" onclick="game.deleteRecording('${recording.id}', '${recording.name}')">
                        <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        // Re-create Lucide icons for the dynamically added buttons
        lucide.createIcons();
    }
    
    async playRecording(recordingId) {
        try {
            const response = await fetch(`/api/recordings/${recordingId}`);
            const recording = await response.json();
            
            if (!response.ok) {
                throw new Error(recording.error || 'Failed to load recording');
            }
            
            // Stop any current activity
            if (this.isRunning) {
                this.toggleSimulation();
            }
            if (this.isReplaying) {
                this.stopTimeline();
            }
            
            // Set up replay data
            this.replayData = recording.generations;
            this.setupTimeline();
            
            // Auto-play the recording
            setTimeout(() => {
                this.playTimeline();
            }, 500);
            
        } catch (error) {
            console.error('Error playing recording:', error);
            alert('Failed to play recording: ' + error.message);
        }
    }
    
    async deleteRecording(recordingId, recordingName) {
        if (!confirm(`Are you sure you want to delete "${recordingName}"?`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/recordings/${recordingId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert(`Recording "${recordingName}" deleted successfully!`);
                this.loadRecordings(); // Refresh the list
            } else {
                throw new Error(result.error || 'Failed to delete recording');
            }
            
        } catch (error) {
            console.error('Error deleting recording:', error);
            alert('Failed to delete recording: ' + error.message);
        }
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
        
        // Update inspector button if it exists
        const inspectorBtn = document.getElementById('cellInspectorBtn');
        if (inspectorBtn) {
            if (this.inspectorMode) {
                inspectorBtn.classList.add('selected');
            } else {
                inspectorBtn.classList.remove('selected');
            }
        }
        
        // Update cursor style based on drawing mode
        if (this.drawingMode === 'cell') {
            this.canvas.style.cursor = 'crosshair';
        } else if (this.inspectorMode) {
            this.canvas.style.cursor = 'help';
        } else {
            this.canvas.style.cursor = 'crosshair'; // Changed from 'copy' to 'crosshair' for better precision
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
            generation: this.engine.generation,
            
            // UI settings
            gridWidth: this.gridWidthSlider.value,
            gridHeight: this.gridHeightSlider.value,
            showGrid: this.showGrid,
            fadeMode: this.fadeMode,
            fadeDuration: this.fadeDuration,
            maturityMode: this.maturityMode,
            maturityEndColor: this.maturityEndColor,
            inspectorMode: this.inspectorMode,
            
            // Slider max values
            speedMax: this.speedMax.value,
            gridWidthMax: this.gridWidthMax.value,
            gridHeightMax: this.gridHeightMax.value,
            cellSizeMax: this.cellSizeMax.value,
            randomDensityMax: this.randomDensityMax.value,
            
            // Grid state
            gridSnapshot: this.engine.getGridSnapshot(),
            
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
                
                // Resize engine with new dimensions
                this.engine.resize(settings.rows, settings.cols);
            }
            
            // Load grid state
            if (settings.gridSnapshot) {
                // Load from new format (engine snapshot)
                this.engine.restoreFromSnapshot(settings.gridSnapshot);
            } else if (settings.grid && Array.isArray(settings.grid) && 
                settings.grid.length === this.rows) {
                // Legacy format - migrate to engine
                for (let row = 0; row < this.rows; row++) {
                    for (let col = 0; col < this.cols; col++) {
                        if (settings.grid[row] && settings.grid[row][col] !== undefined) {
                            this.engine.setCell(row, col, settings.grid[row][col]);
                        }
                    }
                }
                this.engine.generation = settings.generation || 0;
            }
            
            // Load drawing mode
            if (settings.drawingMode !== undefined) {
                if (settings.drawingMode === 'cell') {
                    this.selectCellDrawingMode();
                } else {
                    this.selectDrawingPattern(settings.drawingMode);
                }
            }
            
            // Load grid display state
            if (settings.showGrid !== undefined) {
                this.showGrid = settings.showGrid;
                this.updateGridUI();
            }
            
            // Load fade mode settings
            if (settings.fadeMode !== undefined) {
                this.fadeMode = settings.fadeMode;
                this.updateFadeUI();
            }
            
            if (settings.fadeDuration !== undefined) {
                this.fadeDuration = settings.fadeDuration;
                this.fadeSlider.value = settings.fadeDuration;
                this.fadeValue.textContent = settings.fadeDuration;
            }
            
            // Load maturity mode settings
            if (settings.maturityMode !== undefined) {
                this.maturityMode = settings.maturityMode;
                this.updateMaturityUI();
            }
            
            if (settings.maturityEndColor !== undefined) {
                this.maturityEndColor = settings.maturityEndColor;
                this.maturityColor.value = settings.maturityEndColor;
                this.updateColorLabel();
            }
            
            // Load inspector mode settings
            if (settings.inspectorMode !== undefined && settings.inspectorMode) {
                this.selectInspectorMode();
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
            icon.setAttribute('data-lucide', 'sun');
        } else {
            icon.setAttribute('data-lucide', 'moon');
        }
        lucide.createIcons();
    }
    
    // Pattern Tree Management
    initializePatternTree() {
        this.buildPatternTree();
    }
    
    buildPatternTree() {
        const categories = GameOfLifePatterns.categories;
        const treeHTML = Object.keys(categories).map(categoryKey => {
            const category = categories[categoryKey];
            const subcategories = category.subcategories || {};
            const patterns = GameOfLifePatterns.getByCategory(categoryKey);
            
            const subcategoryHTML = Object.keys(subcategories).map(subKey => {
                const subcategory = subcategories[subKey];
                const subPatterns = patterns.filter(p => p.subcategory === subKey);
                
                if (subPatterns.length === 0) return '';
                
                const patternItemsHTML = subPatterns.map(pattern => `
                    <div class="pattern-item" data-pattern="${pattern.key}" tabindex="0"
                         title="${pattern.description}${pattern.discoverer ? ' • ' + pattern.discoverer : ''}${pattern.year ? ' (' + pattern.year + ')' : ''}">
                        <span class="pattern-icon">${this.getPatternIcon(pattern)}</span>
                        <span class="pattern-name">${pattern.name}</span>
                        ${pattern.period ? `<span class="pattern-info">P${pattern.period}</span>` : ''}
                    </div>
                `).join('');
                
                return `
                    <div class="subcategory">
                        <div class="subcategory-header" data-subcategory="${subKey}" tabindex="0">
                            <i data-lucide="chevron-right" class="subcategory-expand-icon"></i>
                            <span class="subcategory-icon">${subcategory.icon}</span>
                            <span class="subcategory-name">${subcategory.name} (${subPatterns.length})</span>
                        </div>
                        <div class="subcategory-content">
                            ${patternItemsHTML}
                        </div>
                    </div>
                `;
            }).join('');
            
            const totalPatterns = patterns.length;
            
            return `
                <div class="tree-category collapsed">
                    <div class="category-header" data-category="${categoryKey}" tabindex="0">
                        <i data-lucide="chevron-down" class="expand-icon"></i>
                        <span class="category-icon">${category.icon}</span>
                        <span class="category-title">${category.name}</span>
                        <span class="category-count">${totalPatterns}</span>
                    </div>
                    <div class="category-content">
                        ${subcategoryHTML}
                    </div>
                </div>
            `;
        }).join('');
        
        this.patternTree.innerHTML = treeHTML;
        
        // Add event listeners
        this.setupPatternTreeListeners();
    }
    
    getPatternIcon(pattern) {
        // Return appropriate emoji based on pattern type/name
        const iconMap = {
            'block': '⬛',
            'beehive': '🔶', 
            'loaf': '🍞',
            'boat': '⛵',
            'ship': '🚢',
            'tub': '🛁',
            'pond': '🏊',
            'eater1': '👹',
            'blinker': '⚡',
            'beacon': '🔵',
            'toad': '🐸',
            'clock': '🕐',
            'pulsar': '⭐',
            'pentadecathlon': '📏',
            'mazing': '🌀',
            'galaxy': '🌌',
            'glider': '✈️',
            'lwss': '🚀',
            'mwss': '🛸',
            'hwss': '🚁',
            'rpentomino': '🌱',
            'diehard': '💀',
            'acorn': '🌰',
            'gosperglidergun': '🔫',
            'switchengine': '🚂',
            'reflector': '🪞',
            'infinitegrowth1': '📈'
        };
        
        return iconMap[pattern.key || pattern.name] || '🔹';
    }
    
    setupPatternTreeListeners() {
        // Category headers
        this.patternTree.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', () => {
                this.toggleCategory(header);
            });
        });
        
        // Subcategory headers
        this.patternTree.querySelectorAll('.subcategory-header').forEach(header => {
            header.addEventListener('click', () => {
                this.toggleSubcategory(header);
            });
        });
        
        // Pattern items
        this.patternTree.querySelectorAll('.pattern-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectPatternFromTree(item);
            });
        });
        
        // Add keyboard navigation
        this.patternTree.addEventListener('keydown', (e) => {
            this.handleTreeKeyNavigation(e);
        });
    }
    
    toggleCategory(header) {
        const category = header.closest('.tree-category');
        const isCollapsed = category.classList.contains('collapsed');
        
        if (isCollapsed) {
            category.classList.remove('collapsed');
            category.classList.add('expanded');
        } else {
            category.classList.remove('expanded');
            category.classList.add('collapsed');
        }
        
        // Re-initialize Lucide icons after DOM changes
        setTimeout(() => lucide.createIcons(), 0);
    }
    
    toggleSubcategory(header) {
        const subcategory = header.closest('.subcategory');
        const isExpanded = subcategory.classList.contains('expanded');
        
        if (isExpanded) {
            subcategory.classList.remove('expanded');
        } else {
            subcategory.classList.add('expanded');
        }
        
        // Re-initialize Lucide icons after DOM changes
        setTimeout(() => lucide.createIcons(), 0);
    }
    
    handleTreeKeyNavigation(e) {
        const activeElement = document.activeElement;
        let targetElement = null;
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                targetElement = this.getNextFocusableTreeItem(activeElement);
                break;
            case 'ArrowUp':
                e.preventDefault();
                targetElement = this.getPrevFocusableTreeItem(activeElement);
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (activeElement.classList.contains('category-header')) {
                    const category = activeElement.closest('.tree-category');
                    if (category.classList.contains('collapsed')) {
                        this.toggleCategory(activeElement);
                    }
                } else if (activeElement.classList.contains('subcategory-header')) {
                    const subcategory = activeElement.closest('.subcategory');
                    if (!subcategory.classList.contains('expanded')) {
                        this.toggleSubcategory(activeElement);
                    }
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (activeElement.classList.contains('category-header')) {
                    const category = activeElement.closest('.tree-category');
                    if (category.classList.contains('expanded')) {
                        this.toggleCategory(activeElement);
                    }
                } else if (activeElement.classList.contains('subcategory-header')) {
                    const subcategory = activeElement.closest('.subcategory');
                    if (subcategory.classList.contains('expanded')) {
                        this.toggleSubcategory(activeElement);
                    }
                }
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (activeElement.classList.contains('pattern-item')) {
                    this.selectPatternFromTree(activeElement);
                } else if (activeElement.classList.contains('category-header')) {
                    this.toggleCategory(activeElement);
                } else if (activeElement.classList.contains('subcategory-header')) {
                    this.toggleSubcategory(activeElement);
                }
                break;
        }
        
        if (targetElement) {
            targetElement.focus();
        }
    }
    
    getNextFocusableTreeItem(current) {
        // Implementation for getting next focusable item in tree
        return current.nextElementSibling || current.parentElement.nextElementSibling;
    }
    
    getPrevFocusableTreeItem(current) {
        // Implementation for getting previous focusable item in tree
        return current.previousElementSibling || current.parentElement.previousElementSibling;
    }
    
    selectPatternFromTree(item) {
        const patternName = item.dataset.pattern;
        
        // Clear previous selections
        this.patternTree.querySelectorAll('.pattern-item').forEach(p => {
            p.classList.remove('selected');
        });
        this.searchResults.querySelectorAll('.search-result-item').forEach(p => {
            p.classList.remove('selected');
        });
        
        // Select this pattern
        item.classList.add('selected');
        
        // Switch to pattern drawing mode
        this.selectDrawingPattern(patternName);
    }
    
    handlePatternSearch(query) {
        if (!query.trim()) {
            this.clearPatternSearch();
            return;
        }
        
        const results = GameOfLifePatterns.searchPatterns(query);
        this.displaySearchResults(results);
    }
    
    displaySearchResults(results) {
        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <h4>Search Results</h4>
                <div class="no-results">No patterns found matching your search.</div>
            `;
        } else {
            const resultsHTML = results.map(pattern => `
                <div class="search-result-item" data-pattern="${pattern.key || pattern.name}" 
                     title="${pattern.description}${pattern.discoverer ? ' • ' + pattern.discoverer : ''}${pattern.year ? ' (' + pattern.year + ')' : ''}">
                    <div class="search-result-header">
                        <span class="pattern-icon">${this.getPatternIcon(pattern)}</span>
                        <span class="search-result-name">${pattern.name}</span>
                        <span class="search-result-category">${GameOfLifePatterns.categories[pattern.category]?.name || pattern.category}</span>
                    </div>
                    <div class="search-result-description">${pattern.description}</div>
                </div>
            `).join('');
            
            this.searchResults.innerHTML = `
                <h4>Search Results (${results.length})</h4>
                <div class="search-results-list">${resultsHTML}</div>
            `;
            
            // Add event listeners to search results
            this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.selectPatternFromSearch(item);
                });
            });
        }
        
        this.searchResults.style.display = 'block';
        this.patternTree.style.display = 'none';
    }
    
    selectPatternFromSearch(item) {
        const patternName = item.dataset.pattern;
        
        // Clear previous selections
        this.patternTree.querySelectorAll('.pattern-item').forEach(p => {
            p.classList.remove('selected');
        });
        this.searchResults.querySelectorAll('.search-result-item').forEach(p => {
            p.classList.remove('selected');
        });
        
        // Select this pattern
        item.classList.add('selected');
        
        // Switch to pattern drawing mode
        this.selectDrawingPattern(patternName);
    }
    
    clearPatternSearch() {
        this.patternSearch.value = '';
        this.searchResults.style.display = 'none';
        this.patternTree.style.display = 'block';
        
        // Clear search result selections
        this.searchResults.querySelectorAll('.search-result-item').forEach(p => {
            p.classList.remove('selected');
        });
    }
}

// Setup collapsible sections functionality
function setupCollapsibleSections() {
    // Add click listeners to all section headers
    document.querySelectorAll('.section-header[data-toggle]').forEach(header => {
        header.addEventListener('click', (e) => {
            const sectionType = header.dataset.toggle;
            const section = header.closest('.tool-section');
            
            section.classList.toggle('collapsed');
            
            // Save collapsed state to localStorage
            const settings = JSON.parse(localStorage.getItem('gameOfLifeSettings') || '{}');
            if (!settings.collapsedSections) {
                settings.collapsedSections = {};
            }
            settings.collapsedSections[sectionType] = section.classList.contains('collapsed');
            localStorage.setItem('gameOfLifeSettings', JSON.stringify(settings));
        });
    });
    
    // Load collapsed states from localStorage
    try {
        const settings = JSON.parse(localStorage.getItem('gameOfLifeSettings') || '{}');
        if (settings.collapsedSections) {
            Object.entries(settings.collapsedSections).forEach(([sectionType, isCollapsed]) => {
                if (isCollapsed) {
                    const header = document.querySelector(`[data-toggle="${sectionType}"]`);
                    if (header) {
                        const section = header.closest('.tool-section');
                        section.classList.add('collapsed');
                    }
                }
            });
        }
    } catch (error) {
        console.warn('Error loading collapsed section states:', error);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Setup collapsible sections
    setupCollapsibleSections();
    
    // Make game instance global for recording buttons
    window.game = new GameOfLifeStudio('gameCanvas');
    
    // Initialize pattern hints
    window.game.updatePatternHints();
    
    // Initialize grid UI
    window.game.updateGridUI();
    
    // Initialize fade UI
    window.game.updateFadeUI();
    
    // Initialize maturity UI
    window.game.updateMaturityUI();
    window.game.updateColorLabel();
    
    // Load existing recordings
    window.game.loadRecordings();
    
    // Initialize pattern tree
    window.game.initializePatternTree();
    
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
