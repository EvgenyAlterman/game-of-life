/**
 * Fullscreen Manager
 * Handles fullscreen mode with proportional canvas scaling and hover controls
 */

import { eventBus } from '../utils/EventEmitter.js';
import { EVENTS } from '../utils/Constants.js';

export class FullscreenManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.isFullscreen = false;
        this.originalCanvasSize = {
            width: canvas.width,
            height: canvas.height,
            cellSize: 10
        };
        this.fullscreenContainer = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for fullscreen toggle events
        eventBus.on('fullscreen:toggle', () => this.toggle());
        eventBus.on('fullscreen:enter', () => this.enter());
        eventBus.on('fullscreen:exit', () => this.exit());
        
        // Listen for keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' && this.isFullscreen) {
                e.preventDefault();
                eventBus.emit(EVENTS.GAME_START); // Toggle play/pause through event
            }
        });
    }
    
    toggle() {
        if (this.isFullscreen) {
            this.exit();
        } else {
            this.enter();
        }
    }
    
    enter() {
        if (this.isFullscreen) return;
        
        // Store original canvas size
        this.originalCanvasSize = {
            width: this.canvas.width,
            height: this.canvas.height,
            cellSize: this.getCurrentCellSize()
        };
        
        // Create fullscreen container
        this.fullscreenContainer = document.createElement('div');
        this.fullscreenContainer.className = 'fullscreen-container';
        
        // Create fullscreen controls overlay
        const controlsOverlay = this.createFullscreenControls();
        this.fullscreenContainer.appendChild(controlsOverlay);
        
        // Move canvas to fullscreen container
        const gameContainer = document.querySelector('.game-container');
        gameContainer.appendChild(this.fullscreenContainer);
        this.fullscreenContainer.appendChild(this.canvas);
        
        // Calculate optimal canvas size for fullscreen
        const newDimensions = this.calculateFullscreenDimensions();
        
        // Set fullscreen state
        this.isFullscreen = true;
        
        // Hide body scrollbars
        document.body.style.overflow = 'hidden';
        
        // Emit event to notify other modules
        eventBus.emit('fullscreen:entered', {
            originalSize: this.originalCanvasSize,
            newDimensions: newDimensions
        });
        
        console.log('🖥️ Entered fullscreen mode');
    }
    
    exit() {
        if (!this.isFullscreen) return;
        
        // Restore body scrollbars
        document.body.style.overflow = '';
        
        // Move canvas back to original container
        const gameContainer = document.querySelector('.game-container');
        gameContainer.appendChild(this.canvas);
        
        // Remove fullscreen container
        if (this.fullscreenContainer && this.fullscreenContainer.parentNode) {
            this.fullscreenContainer.parentNode.removeChild(this.fullscreenContainer);
        }
        this.fullscreenContainer = null;
        
        // Set fullscreen state
        this.isFullscreen = false;
        
        // Emit event to notify other modules to restore original size
        eventBus.emit('fullscreen:exited', {
            originalSize: this.originalCanvasSize
        });
        
        console.log('📱 Exited fullscreen mode');
    }
    
    getCurrentCellSize() {
        // This would need to be provided by the game engine or renderer
        // For now, return a default
        return 10;
    }
    
    calculateFullscreenDimensions() {
        // Get screen dimensions
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Keep the same cell size for consistency
        const cellSize = this.getCurrentCellSize();
        
        // Calculate maximum grid size that fits on screen
        const maxCols = Math.floor(screenWidth / cellSize);
        const maxRows = Math.floor(screenHeight / cellSize);
        
        // Calculate centered canvas size
        const newWidth = maxCols * cellSize;
        const newHeight = maxRows * cellSize;
        
        return {
            width: newWidth,
            height: newHeight,
            cellSize: cellSize,
            rows: maxRows,
            cols: maxCols
        };
    }
    
    createFullscreenControls() {
        const controls = document.createElement('div');
        controls.className = 'fullscreen-controls';
        
        // Left side controls
        const leftGroup = document.createElement('div');
        leftGroup.className = 'control-group';
        
        // Exit fullscreen button
        const exitBtn = document.createElement('div');
        exitBtn.className = 'fullscreen-btn';
        exitBtn.title = 'Exit Fullscreen';
        exitBtn.innerHTML = '<i data-lucide="minimize" class="exit-icon"></i>';
        exitBtn.addEventListener('click', () => this.exit());
        leftGroup.appendChild(exitBtn);
        
        // Play/pause button
        const playPauseBtn = document.createElement('div');
        playPauseBtn.className = 'fullscreen-btn';
        playPauseBtn.id = 'fullscreenPlayPause';
        this.updateFullscreenPlayPauseButton(playPauseBtn);
        playPauseBtn.addEventListener('click', () => {
            eventBus.emit(EVENTS.GAME_START); // Toggle through event system
            setTimeout(() => this.updateFullscreenPlayPauseButton(playPauseBtn), 50);
        });
        leftGroup.appendChild(playPauseBtn);
        
        controls.appendChild(leftGroup);
        
        // Right side info
        const rightGroup = document.createElement('div');
        rightGroup.className = 'control-group';
        
        const info = document.createElement('div');
        info.className = 'fullscreen-info';
        info.textContent = 'Press SPACE to play/pause';
        rightGroup.appendChild(info);
        
        controls.appendChild(rightGroup);
        
        // Listen for game state changes to update buttons
        eventBus.on(EVENTS.GAME_START, () => {
            setTimeout(() => this.updateFullscreenPlayPauseButton(playPauseBtn), 50);
        });
        
        eventBus.on(EVENTS.GAME_STOP, () => {
            setTimeout(() => this.updateFullscreenPlayPauseButton(playPauseBtn), 50);
        });
        
        return controls;
    }
    
    updateFullscreenPlayPauseButton(button) {
        const icon = button.querySelector('i') || document.createElement('i');
        
        // We need to get the current game state from somewhere
        // For now, we'll use a simple approach
        eventBus.emit('game:state:request', (isRunning) => {
            if (isRunning) {
                icon.setAttribute('data-lucide', 'pause');
                button.title = 'Pause Simulation';
            } else {
                icon.setAttribute('data-lucide', 'play');
                button.title = 'Start Simulation';
            }
            
            if (!button.querySelector('i')) {
                button.appendChild(icon);
            }
            
            // Re-initialize Lucide icons for new elements
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });
    }
    
    // Settings for persistence
    getSettings() {
        return {
            isFullscreen: this.isFullscreen
        };
    }
    
    applySettings(settings) {
        // Note: We typically don't want to restore fullscreen state on page load
        // but this method is here for completeness
    }
}
