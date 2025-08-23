/**
 * Game of Life Main Orchestrator - Modular Version
 * Uses refactored modular architecture with full functionality
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
        this.loadSettings();
        this.render();
        this.updateInfo();
        
        console.log('🎮 Modular Game of Life initialized with all features!');
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
        
        this.renderer.drawGrid(this.engine.grid, {
            fadeGrid: fadeGrid,
            fadeMode: this.fadeSystem.isActive,
            fadeDuration: this.fadeSystem.duration,
            matureCells: matureCells,
            previewCells: []
        });
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
}
