/**
 * Game of Life Complete Modular Implementation
 * Full-featured version using refactored modular architecture
 */

import { GameEngine } from './core/GameEngine.js';
import { CanvasRenderer } from './renderer/CanvasRenderer.js';
import { MaturitySystem } from './features/MaturitySystem.js';
import { FadeSystem } from './features/FadeSystem.js';
import { CellInspector } from './features/CellInspector.js';
import { FullscreenManager } from './features/FullscreenManager.js';
import { GameOfLifePatterns } from './patterns/PatternLibrary.js';
import { eventBus } from './utils/EventEmitter.js';
import { DEFAULTS, EVENTS, DRAWING_MODES } from './utils/Constants.js';

export class GameOfLife {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        
        // Initialize core components
        this.engine = new GameEngine(DEFAULTS.GRID_HEIGHT, DEFAULTS.GRID_WIDTH);
        this.renderer = new CanvasRenderer(this.canvas, DEFAULTS.CELL_SIZE);
        
        // Initialize feature modules
        this.maturitySystem = new MaturitySystem(this.engine.rows, this.engine.cols);
        this.fadeSystem = new FadeSystem(this.engine.rows, this.engine.cols);
        this.cellInspector = new CellInspector(this.canvas);
        this.fullscreenManager = new FullscreenManager(this.canvas);
        
        // Set up dependencies
        this.cellInspector.setDependencies(this.engine, this.maturitySystem);
        
        // Game state
        this.isRunning = false;
        this.animationId = null;
        this.speed = DEFAULTS.SPEED;
        this.lastTime = 0;
        
        // Drawing state
        this.drawingMode = DRAWING_MODES.CELL;
        this.selectedPattern = null;
        this.patternRotation = 0;
        this.previewPosition = null;
        
        // Initial state for reset functionality
        this.initialState = null;
        this.initialGeneration = 0;
        
        this.setupEventListeners();
        this.setupUIEvents();
        this.setupAllControls();
        this.setupPatternLibrary();
        this.setupSidebar();
        this.initializeDarkMode();
        this.loadSettings();
        this.render();
        this.updateInfo();
        this.updateDrawingModeUI();
        
        console.log('🎮 Complete Modular Game of Life initialized!');
    }
    
    setupEventListeners() {
        // Core game events
        eventBus.on(EVENTS.GAME_START, () => this.toggle());
        eventBus.on(EVENTS.GENERATION_UPDATE, () => this.render());
        
        // Fullscreen events
        eventBus.on('fullscreen:entered', (data) => this.handleFullscreenEnter(data));
        eventBus.on('fullscreen:exited', (data) => this.handleFullscreenExit(data));
        
        // Game state requests (for fullscreen controls)
        eventBus.on('game:state:request', (callback) => {
            if (typeof callback === 'function') {
                callback(this.isRunning);
            }
        });
    }
    
    setupUIEvents() {
        // Basic control buttons
        const startStopBtn = document.getElementById('startStopBtn');
        const resetBtn = document.getElementById('resetBtn');
        const clearBtn = document.getElementById('clearBtn');
        const randomBtn = document.getElementById('randomBtn');
        const fullscreenToggle = document.getElementById('fullscreenToggle');
        
        if (startStopBtn) {
            startStopBtn.addEventListener('click', () => this.toggle());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clear());
        }
        
        if (randomBtn) {
            randomBtn.addEventListener('click', () => this.randomize());
        }
        
        if (fullscreenToggle) {
            fullscreenToggle.addEventListener('click', () => {
                eventBus.emit('fullscreen:toggle');
            });
        }
        
        // Canvas interactions
        this.setupCanvasEvents();
    }
    
    setupCanvasEvents() {
        let isDrawing = false;
        let drawingState = true;
        
        // Mouse events
        this.canvas.addEventListener('click', (e) => {
            if (this.isRunning) return;
            
            const pos = this.renderer.getCanvasPosition(e.clientX, e.clientY);
            const cell = this.renderer.getCellFromPosition(pos.x, pos.y);
            
            if (this.drawingMode === DRAWING_MODES.CELL) {
                this.engine.toggleCell(cell.row, cell.col);
                this.render();
                this.updateInfo();
                this.saveSettings();
            } else if (this.drawingMode === DRAWING_MODES.PATTERN && this.selectedPattern) {
                this.placePattern(cell.row, cell.col);
            }
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.isRunning || this.drawingMode !== DRAWING_MODES.CELL) return;
            
            isDrawing = true;
            const pos = this.renderer.getCanvasPosition(e.clientX, e.clientY);
            const cell = this.renderer.getCellFromPosition(pos.x, pos.y);
            
            if (cell.row >= 0 && cell.row < this.engine.rows && 
                cell.col >= 0 && cell.col < this.engine.cols) {
                drawingState = !this.engine.getCell(cell.row, cell.col);
                this.engine.setCell(cell.row, cell.col, drawingState);
                this.render();
                this.updateInfo();
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const pos = this.renderer.getCanvasPosition(e.clientX, e.clientY);
            const cell = this.renderer.getCellFromPosition(pos.x, pos.y);
            
            if (isDrawing && this.drawingMode === DRAWING_MODES.CELL) {
                if (cell.row >= 0 && cell.row < this.engine.rows && 
                    cell.col >= 0 && cell.col < this.engine.cols) {
                    this.engine.setCell(cell.row, cell.col, drawingState);
                    this.render();
                    this.updateInfo();
                }
            } else if (this.drawingMode === DRAWING_MODES.PATTERN && this.selectedPattern) {
                this.updatePreview(cell.row, cell.col);
            } else if (this.drawingMode === DRAWING_MODES.INSPECTOR) {
                this.cellInspector.handleMouseMove(cell.row, cell.col, e.clientX, e.clientY, this.renderer.cellSize);
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            if (isDrawing) {
                this.saveSettings();
            }
            isDrawing = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            isDrawing = false;
            this.clearPreview();
            this.cellInspector.hideTooltip();
        });
        
        // Keyboard events for pattern rotation
        document.addEventListener('keydown', (e) => {
            if (this.drawingMode === DRAWING_MODES.PATTERN && this.selectedPattern) {
                if (e.key === '[') {
                    e.preventDefault();
                    this.rotatePattern(-90);
                } else if (e.key === ']') {
                    e.preventDefault();
                    this.rotatePattern(90);
                }
            }
        });
    }
    
    setupAllControls() {
        // Speed control
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        const speedMax = document.getElementById('speedMax');
        
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.speed = parseInt(e.target.value);
                if (speedValue) speedValue.textContent = this.speed;
                this.saveSettings();
            });
        }
        
        if (speedMax) {
            speedMax.addEventListener('input', (e) => {
                this.updateSliderMax(speedSlider, e.target.value);
                this.saveSettings();
            });
        }
        
        // Drawing mode buttons
        const cellDrawingBtn = document.getElementById('cellDrawingBtn');
        const cellInspectorBtn = document.getElementById('cellInspectorBtn');
        
        if (cellDrawingBtn) {
            cellDrawingBtn.addEventListener('click', () => {
                this.setDrawingMode(DRAWING_MODES.CELL);
            });
        }
        
        if (cellInspectorBtn) {
            cellInspectorBtn.addEventListener('click', () => {
                this.setDrawingMode(DRAWING_MODES.INSPECTOR);
            });
        }
        
        // Feature toggles
        const fadeToggle = document.getElementById('fadeToggle');
        const maturityToggle = document.getElementById('maturityToggle');
        const gridToggle = document.getElementById('gridToggle');
        
        if (fadeToggle) {
            fadeToggle.addEventListener('click', () => {
                this.fadeSystem.toggle();
                this.updateFeatureToggleUI();
                this.render();
                this.saveSettings();
            });
        }
        
        if (maturityToggle) {
            maturityToggle.addEventListener('click', () => {
                this.maturitySystem.toggle();
                this.updateFeatureToggleUI();
                this.render();
                this.saveSettings();
            });
        }
        
        if (gridToggle) {
            gridToggle.addEventListener('click', () => {
                this.renderer.toggleGridOverlay();
                this.updateFeatureToggleUI();
                this.render();
                this.saveSettings();
            });
        }
        
        // Grid settings controls
        this.setupGridControls();
        
        // Random generation controls
        this.setupRandomControls();
        
        // Quick action buttons
        this.setupQuickActions();
    }
    
    setupGridControls() {
        const gridWidthSlider = document.getElementById('gridWidth');
        const gridWidthValue = document.getElementById('gridWidthValue');
        const gridWidthMax = document.getElementById('gridWidthMax');
        const gridHeightSlider = document.getElementById('gridHeight');
        const gridHeightValue = document.getElementById('gridHeightValue');
        const gridHeightMax = document.getElementById('gridHeightMax');
        const cellSizeSlider = document.getElementById('cellSize');
        const cellSizeValue = document.getElementById('cellSizeValue');
        const cellSizeMax = document.getElementById('cellSizeMax');
        const applyGridBtn = document.getElementById('applyGridBtn');
        
        if (gridWidthSlider) {
            gridWidthSlider.addEventListener('input', (e) => {
                if (gridWidthValue) gridWidthValue.textContent = e.target.value;
                this.saveSettings();
            });
        }
        
        if (gridWidthMax) {
            gridWidthMax.addEventListener('input', (e) => {
                this.updateSliderMax(gridWidthSlider, e.target.value);
                this.saveSettings();
            });
        }
        
        if (gridHeightSlider) {
            gridHeightSlider.addEventListener('input', (e) => {
                if (gridHeightValue) gridHeightValue.textContent = e.target.value;
                this.saveSettings();
            });
        }
        
        if (gridHeightMax) {
            gridHeightMax.addEventListener('input', (e) => {
                this.updateSliderMax(gridHeightSlider, e.target.value);
                this.saveSettings();
            });
        }
        
        if (cellSizeSlider) {
            cellSizeSlider.addEventListener('input', (e) => {
                if (cellSizeValue) cellSizeValue.textContent = e.target.value + 'px';
                this.saveSettings();
            });
        }
        
        if (cellSizeMax) {
            cellSizeMax.addEventListener('input', (e) => {
                this.updateSliderMax(cellSizeSlider, e.target.value);
                this.saveSettings();
            });
        }
        
        if (applyGridBtn) {
            applyGridBtn.addEventListener('click', () => {
                this.applyGridSettings();
            });
        }
    }
    
    setupRandomControls() {
        const randomDensitySlider = document.getElementById('randomDensity');
        const randomDensityValue = document.getElementById('randomDensityValue');
        const randomDensityMax = document.getElementById('randomDensityMax');
        const randomSeedInput = document.getElementById('randomSeed');
        const generateSeedBtn = document.getElementById('generateSeedBtn');
        
        if (randomDensitySlider) {
            randomDensitySlider.addEventListener('input', (e) => {
                if (randomDensityValue) randomDensityValue.textContent = e.target.value + '%';
                this.saveSettings();
            });
        }
        
        if (randomDensityMax) {
            randomDensityMax.addEventListener('input', (e) => {
                this.updateSliderMax(randomDensitySlider, e.target.value);
                this.saveSettings();
            });
        }
        
        if (generateSeedBtn) {
            generateSeedBtn.addEventListener('click', () => {
                const seed = Math.floor(Math.random() * 1000000);
                if (randomSeedInput) randomSeedInput.value = seed;
                this.saveSettings();
            });
        }
    }
    
    setupQuickActions() {
        const fillRandomBtn = document.getElementById('fillRandomBtn');
        const fillEdgesBtn = document.getElementById('fillEdgesBtn');
        const fillCenterBtn = document.getElementById('fillCenterBtn');
        const invertBtn = document.getElementById('invertBtn');
        
        if (fillRandomBtn) {
            fillRandomBtn.addEventListener('click', () => {
                const density = document.getElementById('randomDensity')?.value || 30;
                this.engine.randomize(density / 100);
                this.render();
                this.updateInfo();
                this.saveSettings();
            });
        }
        
        if (fillEdgesBtn) {
            fillEdgesBtn.addEventListener('click', () => {
                this.fillEdges();
                this.render();
                this.updateInfo();
                this.saveSettings();
            });
        }
        
        if (fillCenterBtn) {
            fillCenterBtn.addEventListener('click', () => {
                this.fillCenter();
                this.render();
                this.updateInfo();
                this.saveSettings();
            });
        }
        
        if (invertBtn) {
            invertBtn.addEventListener('click', () => {
                this.invertGrid();
                this.render();
                this.updateInfo();
                this.saveSettings();
            });
        }
    }
    
    setupPatternLibrary() {
        // Pattern search
        const patternSearch = document.getElementById('patternSearch');
        if (patternSearch) {
            patternSearch.addEventListener('input', (e) => {
                this.searchPatterns(e.target.value);
            });
        }
        
        // Initialize pattern tree
        this.populatePatternTree();
    }
    
    populatePatternTree() {
        const patternTree = document.getElementById('patternTree');
        if (!patternTree) return;
        
        patternTree.innerHTML = '';
        
        const categories = GameOfLifePatterns.getCategories();
        categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'pattern-category';
            
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            categoryHeader.innerHTML = `
                <i data-lucide="chevron-right" class="category-icon"></i>
                <span>${category.displayName}</span>
                <span class="pattern-count">(${category.patterns.length})</span>
            `;
            
            const patternList = document.createElement('div');
            patternList.className = 'pattern-list';
            patternList.style.display = 'none';
            
            category.patterns.forEach(pattern => {
                const patternElement = document.createElement('div');
                patternElement.className = 'pattern-item';
                patternElement.dataset.pattern = pattern.key;
                patternElement.innerHTML = `
                    <i data-lucide="plus" class="pattern-icon"></i>
                    <span class="pattern-name">${pattern.name}</span>
                `;
                
                patternElement.addEventListener('click', () => {
                    this.selectPattern(pattern.key);
                    this.updatePatternSelection();
                });
                
                patternList.appendChild(patternElement);
            });
            
            categoryHeader.addEventListener('click', () => {
                const isExpanded = patternList.style.display !== 'none';
                patternList.style.display = isExpanded ? 'none' : 'block';
                const icon = categoryHeader.querySelector('.category-icon');
                icon.setAttribute('data-lucide', isExpanded ? 'chevron-right' : 'chevron-down');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            });
            
            categoryElement.appendChild(categoryHeader);
            categoryElement.appendChild(patternList);
            patternTree.appendChild(categoryElement);
        });
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    searchPatterns(query) {
        const searchResults = document.getElementById('searchResults');
        const patternTree = document.getElementById('patternTree');
        
        if (!query.trim()) {
            searchResults.style.display = 'none';
            patternTree.style.display = 'block';
            return;
        }
        
        const results = GameOfLifePatterns.searchPatterns(query);
        const resultsList = searchResults.querySelector('.search-results-list');
        
        if (results.length === 0) {
            resultsList.innerHTML = '<p class="no-results">No patterns found</p>';
        } else {
            resultsList.innerHTML = results.map(pattern => `
                <div class="pattern-item" data-pattern="${pattern.key}">
                    <i data-lucide="plus" class="pattern-icon"></i>
                    <span class="pattern-name">${pattern.name}</span>
                </div>
            `).join('');
            
            // Add event listeners
            resultsList.querySelectorAll('.pattern-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.selectPattern(item.dataset.pattern);
                    this.updatePatternSelection();
                });
            });
        }
        
        searchResults.style.display = 'block';
        patternTree.style.display = 'none';
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    selectPattern(patternKey) {
        this.selectedPattern = GameOfLifePatterns.getPattern(patternKey);
        this.setDrawingMode(DRAWING_MODES.PATTERN);
        this.patternRotation = 0;
    }
    
    updatePatternSelection() {
        // Update UI to show selected pattern
        const allPatternItems = document.querySelectorAll('.pattern-item');
        allPatternItems.forEach(item => item.classList.remove('selected'));
        
        if (this.selectedPattern) {
            const selectedItem = document.querySelector(`[data-pattern="${this.selectedPattern.key}"]`);
            if (selectedItem) selectedItem.classList.add('selected');
        }
    }
    
    setDrawingMode(mode) {
        this.drawingMode = mode;
        this.clearPreview();
        
        if (mode === DRAWING_MODES.INSPECTOR) {
            this.cellInspector.activate();
        } else {
            this.cellInspector.deactivate();
        }
        
        this.updateCursor();
        this.updateDrawingModeUI();
    }
    
    updateCursor() {
        switch (this.drawingMode) {
            case DRAWING_MODES.CELL:
                this.canvas.style.cursor = 'crosshair';
                break;
            case DRAWING_MODES.PATTERN:
                this.canvas.style.cursor = 'crosshair';
                break;
            case DRAWING_MODES.INSPECTOR:
                this.canvas.style.cursor = 'help';
                break;
            default:
                this.canvas.style.cursor = 'default';
        }
    }
    
    updateDrawingModeUI() {
        const cellBtn = document.getElementById('cellDrawingBtn');
        const inspectorBtn = document.getElementById('cellInspectorBtn');
        
        if (cellBtn) {
            cellBtn.classList.toggle('selected', this.drawingMode === DRAWING_MODES.CELL);
        }
        
        if (inspectorBtn) {
            inspectorBtn.classList.toggle('selected', this.drawingMode === DRAWING_MODES.INSPECTOR);
        }
    }
    
    updateFeatureToggleUI() {
        const fadeToggle = document.getElementById('fadeToggle');
        const maturityToggle = document.getElementById('maturityToggle');
        const gridToggle = document.getElementById('gridToggle');
        
        if (fadeToggle) {
            fadeToggle.classList.toggle('selected', this.fadeSystem.isActive);
        }
        
        if (maturityToggle) {
            maturityToggle.classList.toggle('selected', this.maturitySystem.isActive);
        }
        
        if (gridToggle) {
            gridToggle.classList.toggle('selected', this.renderer.showGridOverlay);
        }
    }
    
    toggle() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.captureInitialState();
        this.animate(0);
        this.updatePlayPauseButton();
    }
    
    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.updatePlayPauseButton();
    }
    
    animate(currentTime) {
        if (!this.isRunning) return;
        
        const interval = 1000 / this.speed;
        if (currentTime - this.lastTime >= interval) {
            this.engine.nextGeneration();
            this.updateInfo();
            this.lastTime = currentTime - ((currentTime - this.lastTime) % interval);
        }
        
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }
    
    render() {
        const fadeGrid = this.fadeSystem.getFadeGrid();
        const matureCells = this.maturitySystem.getCellsForRendering(this.engine.grid);
        const previewCells = this.getPreviewCells();
        
        this.renderer.drawGrid(this.engine.grid, {
            fadeGrid: fadeGrid,
            fadeMode: this.fadeSystem.isActive,
            fadeDuration: this.fadeSystem.duration,
            matureCells: matureCells,
            previewCells: previewCells
        });
    }
    
    getPreviewCells() {
        if (this.drawingMode === DRAWING_MODES.PATTERN && 
            this.selectedPattern && 
            this.previewPosition) {
            
            return this.renderer.drawPatternPreview(
                this.selectedPattern,
                this.previewPosition.row,
                this.previewPosition.col,
                this.patternRotation
            );
        }
        
        return [];
    }
    
    placePattern(row, col) {
        if (!this.selectedPattern) return;
        
        const startRow = row - Math.floor(this.selectedPattern.length / 2);
        const startCol = col - Math.floor(this.selectedPattern[0].length / 2);
        
        this.engine.placePattern(this.selectedPattern, startRow, startCol, this.patternRotation);
        this.clearPreview();
        this.render();
        this.updateInfo();
        this.saveSettings();
    }
    
    updatePreview(row, col) {
        if (this.previewPosition && 
            this.previewPosition.row === row && 
            this.previewPosition.col === col) {
            return;
        }
        
        this.previewPosition = { row, col };
        this.render();
    }
    
    clearPreview() {
        if (this.previewPosition) {
            this.previewPosition = null;
            this.render();
        }
    }
    
    rotatePattern(degrees) {
        this.patternRotation = (this.patternRotation + degrees + 360) % 360;
        if (this.previewPosition) {
            this.render();
        }
    }
    
    reset() {
        this.stop();
        
        if (this.initialState) {
            this.restoreInitialState();
        } else {
            this.engine.generation = 0;
            this.engine.clearGrid();
        }
        
        this.render();
        this.updateInfo();
    }
    
    clear() {
        this.stop();
        this.engine.clearGrid();
        this.clearInitialState();
        this.render();
        this.updateInfo();
        this.saveSettings();
    }
    
    randomize() {
        this.stop();
        this.engine.randomize(0.3);
        this.clearInitialState();
        this.render();
        this.updateInfo();
        this.saveSettings();
    }
    
    captureInitialState() {
        this.initialState = this.engine.getGridCopy();
        this.initialGeneration = this.engine.generation;
    }
    
    restoreInitialState() {
        if (!this.initialState) return;
        
        this.engine.setGrid(this.initialState);
        this.engine.generation = this.initialGeneration;
    }
    
    clearInitialState() {
        this.initialState = null;
        this.initialGeneration = 0;
    }
    
    updateInfo() {
        const population = this.engine.calculatePopulation();
        
        const generationDisplay = document.getElementById('generation');
        if (generationDisplay) {
            generationDisplay.textContent = this.engine.generation;
        }
        
        const populationDisplay = document.getElementById('population');
        if (populationDisplay) {
            populationDisplay.textContent = population;
        }
    }
    
    updatePlayPauseButton() {
        const startStopBtn = document.getElementById('startStopBtn');
        if (!startStopBtn) return;
        
        const playIcon = startStopBtn.querySelector('.btn-icon');
        if (!playIcon) return;
        
        if (this.isRunning) {
            playIcon.setAttribute('data-lucide', 'pause');
            startStopBtn.title = 'Pause Simulation';
        } else {
            playIcon.setAttribute('data-lucide', 'play');
            startStopBtn.title = 'Start Simulation';
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    handleFullscreenEnter(data) {
        const { newDimensions } = data;
        this.engine.resize(newDimensions.rows, newDimensions.cols);
        this.renderer.resize(newDimensions.width, newDimensions.height, newDimensions.cellSize);
        this.render();
    }
    
    handleFullscreenExit(data) {
        const { originalSize } = data;
        const rows = Math.floor(originalSize.height / originalSize.cellSize);
        const cols = Math.floor(originalSize.width / originalSize.cellSize);
        
        this.engine.resize(rows, cols);
        this.renderer.resize(originalSize.width, originalSize.height, originalSize.cellSize);
        this.render();
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('gameOfLifeSettings');
            if (!saved) return;
            
            const settings = JSON.parse(saved);
            
            // Validate settings age (don't load if older than 30 days)
            const maxAge = 30 * 24 * 60 * 60 * 1000;
            if (settings.timestamp && (Date.now() - settings.timestamp > maxAge)) {
                localStorage.removeItem('gameOfLifeSettings');
                return;
            }
            
            this.applySettings(settings);
            
        } catch (error) {
            console.warn('Failed to load saved settings:', error);
            localStorage.removeItem('gameOfLifeSettings');
        }
    }
    
    saveSettings() {
        const settings = this.gatherSettings();
        localStorage.setItem('gameOfLifeSettings', JSON.stringify(settings));
    }
    
    gatherSettings() {
        return {
            // Game state
            speed: this.speed,
            generation: this.engine.generation,
            cellSize: this.renderer.cellSize,
            rows: this.engine.rows,
            cols: this.engine.cols,
            grid: this.engine.getGridCopy(),
            drawingMode: this.drawingMode,
            
            // Feature settings
            fadeActive: this.fadeSystem.isActive,
            fadeDuration: this.fadeSystem.duration,
            maturityActive: this.maturitySystem.isActive,
            gridOverlay: this.renderer.showGridOverlay,
            
            // Timestamp
            timestamp: Date.now()
        };
    }
    
    applySettings(settings) {
        // Apply core settings
        if (settings.speed !== undefined) {
            this.speed = settings.speed;
            const speedSlider = document.getElementById('speedSlider');
            const speedValue = document.getElementById('speedValue');
            if (speedSlider) speedSlider.value = settings.speed;
            if (speedValue) speedValue.textContent = settings.speed;
        }
        
        if (settings.cellSize !== undefined || settings.rows !== undefined || settings.cols !== undefined) {
            const cellSize = settings.cellSize || this.renderer.cellSize;
            const rows = settings.rows || this.engine.rows;
            const cols = settings.cols || this.engine.cols;
            
            this.engine.resize(rows, cols);
            this.renderer.resize(cols * cellSize, rows * cellSize, cellSize);
        }
        
        if (settings.grid && settings.generation !== undefined) {
            this.engine.setGrid(settings.grid);
            this.engine.generation = settings.generation;
        }
        
        if (settings.drawingMode) {
            this.setDrawingMode(settings.drawingMode);
        }
        
        // Apply feature settings
        if (settings.fadeActive !== undefined) {
            this.fadeSystem.isActive = settings.fadeActive;
        }
        
        if (settings.fadeDuration !== undefined) {
            this.fadeSystem.duration = settings.fadeDuration;
        }
        
        if (settings.maturityActive !== undefined) {
            this.maturitySystem.isActive = settings.maturityActive;
        }
        
        if (settings.gridOverlay !== undefined) {
            this.renderer.showGridOverlay = settings.gridOverlay;
        }
        
        // Update UI to reflect loaded state
        this.updateFeatureToggleUI();
        this.render();
        this.updateInfo();
        this.updatePlayPauseButton();
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
        
        // Setup dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                this.toggleDarkMode();
            });
        }
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
        this.render();
    }
    
    updateDarkModeIcon(isDark) {
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (!darkModeToggle) return;
        
        const icon = darkModeToggle.querySelector('.toggle-icon');
        if (!icon) return;
        
        if (isDark) {
            icon.setAttribute('data-lucide', 'sun');
        } else {
            icon.setAttribute('data-lucide', 'moon');
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    // Sidebar functionality
    setupSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('hidden');
                sidebarToggle.textContent = sidebar.classList.contains('hidden') ? '›' : '‹';
            });
        }
        
        if (mobileMenuBtn && sidebar) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.add('mobile-open');
                if (sidebarOverlay) sidebarOverlay.classList.add('active');
            });
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                if (sidebar) sidebar.classList.remove('mobile-open');
                sidebarOverlay.classList.remove('active');
            });
        }
        
        // Setup collapsible sections
        this.setupCollapsibleSections();
    }
    
    setupCollapsibleSections() {
        const sectionHeaders = document.querySelectorAll('.section-header[data-toggle]');
        
        sectionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const targetId = header.dataset.toggle;
                const content = document.getElementById(targetId + 'Content');
                const icon = header.querySelector('.toggle-icon');
                
                if (content && icon) {
                    const isExpanded = content.style.display !== 'none';
                    content.style.display = isExpanded ? 'none' : 'block';
                    icon.setAttribute('data-lucide', isExpanded ? 'chevron-right' : 'chevron-down');
                    
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            });
        });
    }
    
    // Utility methods
    updateSliderMax(slider, maxValue) {
        if (!slider) return;
        
        const value = parseInt(maxValue);
        if (isNaN(value)) return;
        
        slider.max = value;
        if (parseInt(slider.value) > value) {
            slider.value = value;
        }
    }
    
    applyGridSettings() {
        const gridWidthSlider = document.getElementById('gridWidth');
        const gridHeightSlider = document.getElementById('gridHeight');
        const cellSizeSlider = document.getElementById('cellSize');
        
        if (gridWidthSlider && gridHeightSlider && cellSizeSlider) {
            const cols = parseInt(gridWidthSlider.value);
            const rows = parseInt(gridHeightSlider.value);
            const cellSize = parseInt(cellSizeSlider.value);
            
            this.engine.resize(rows, cols);
            this.renderer.resize(cols * cellSize, rows * cellSize, cellSize);
            this.render();
            this.updateInfo();
            this.saveSettings();
        }
    }
    
    fillEdges() {
        for (let row = 0; row < this.engine.rows; row++) {
            for (let col = 0; col < this.engine.cols; col++) {
                if (row === 0 || row === this.engine.rows - 1 || 
                    col === 0 || col === this.engine.cols - 1) {
                    this.engine.setCell(row, col, true);
                }
            }
        }
    }
    
    fillCenter() {
        const centerRow = Math.floor(this.engine.rows / 2);
        const centerCol = Math.floor(this.engine.cols / 2);
        const radius = Math.min(this.engine.rows, this.engine.cols) / 4;
        
        for (let row = 0; row < this.engine.rows; row++) {
            for (let col = 0; col < this.engine.cols; col++) {
                const distance = Math.sqrt(
                    Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
                );
                if (distance <= radius) {
                    this.engine.setCell(row, col, true);
                }
            }
        }
    }
    
    invertGrid() {
        for (let row = 0; row < this.engine.rows; row++) {
            for (let col = 0; col < this.engine.cols; col++) {
                const currentState = this.engine.getCell(row, col);
                this.engine.setCell(row, col, !currentState);
            }
        }
    }
    
    updateDrawingModeUI() {
        // This method ensures the UI reflects the current drawing mode
        this.updateCursor();
        this.updatePatternSelection();
        this.updateFeatureToggleUI();
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons first
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
        console.log('🎨 Lucide icons initialized');
    }
    
    // Create game instance
    const game = new GameOfLife('gameCanvas');
    
    // Expose globally for compatibility with existing UI features
    window.gameOfLife = game;
    window.GameOfLifePatterns = GameOfLifePatterns;
    
    // Re-initialize icons after game setup (in case new elements were created)
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
            console.log('🔄 Lucide icons refreshed after setup');
        }
    }, 100);
    
    console.log('✅ Modular Game of Life ready!');
});
