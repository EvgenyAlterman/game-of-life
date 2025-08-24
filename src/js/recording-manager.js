/**
 * Recording Manager Module
 * Handles all recording, timeline, and replay functionality for Game of Life Studio
 * Separated from the main game class for better organization and maintainability
 */

export class RecordingManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        
        // Recording state
        this.isRecording = false;
        this.recordedGenerations = [];
        this.recordingStartTime = null;
        
        // Timeline/Replay state
        this.isReplaying = false;
        this.replayData = null;
        this.replayIndex = 0;
        this.replaySpeed = 5;
        this.replayInterval = null;
        
        // UI elements
        this.initializeUIElements();
        this.setupEventListeners();
        
        console.log('🎬 RecordingManager initialized');
    }
    
    /**
     * Initialize UI element references
     */
    initializeUIElements() {
        // Recording controls
        this.recordBtn = document.getElementById('recordBtn');
        this.finishBtn = document.getElementById('finishBtn');
        
        // Timeline controls
        this.playTimelineBtn = document.getElementById('playTimelineBtn');
        this.pauseTimelineBtn = document.getElementById('pauseTimelineBtn');
        this.stopTimelineBtn = document.getElementById('stopTimelineBtn');
        this.timelineSlider = document.getElementById('timelineSlider');
        this.playbackSpeed = document.getElementById('playbackSpeed');
        
        // Timeline info displays
        this.currentFrame = document.getElementById('currentFrame');
        this.totalFrames = document.getElementById('totalFrames');
        this.speedValue = document.getElementById('speedValue');
        
        // Timeline section
        this.timelineSection = document.getElementById('timelineSection');
        
        // Recording management
        this.loadRecordingsBtn = document.getElementById('loadRecordingsBtn');
        this.recordingsList = document.getElementById('recordingsList');
        
        // Save modal elements
        this.saveModal = document.getElementById('saveModal');
        this.recordingName = document.getElementById('recordingName');
        this.modalClose = document.getElementById('modalClose');
        this.cancelSave = document.getElementById('cancelSave');
        this.confirmSave = document.getElementById('confirmSave');
    }
    
    /**
     * Setup event listeners for recording UI
     */
    setupEventListeners() {
        // Recording controls
        if (this.recordBtn) {
            this.recordBtn.addEventListener('click', () => {
                this.toggleRecording();
            });
        }
        
        if (this.finishBtn) {
            this.finishBtn.addEventListener('click', () => {
                this.finishRecording();
            });
        }
        
        // Timeline controls
        if (this.playTimelineBtn) {
            this.playTimelineBtn.addEventListener('click', () => {
                this.playTimeline();
            });
        }
        
        if (this.pauseTimelineBtn) {
            this.pauseTimelineBtn.addEventListener('click', () => {
                this.pauseTimeline();
            });
        }
        
        if (this.stopTimelineBtn) {
            this.stopTimelineBtn.addEventListener('click', () => {
                this.stopTimeline();
            });
        }
        
        if (this.timelineSlider) {
            this.timelineSlider.addEventListener('input', (e) => {
                this.seekTimeline(parseInt(e.target.value));
            });
        }
        
        if (this.playbackSpeed) {
            this.playbackSpeed.addEventListener('input', (e) => {
                this.replaySpeed = parseInt(e.target.value);
                if (this.speedValue) {
                    this.speedValue.textContent = e.target.value + 'x';
                }
            });
        }
        
        // Recording management
        if (this.loadRecordingsBtn) {
            this.loadRecordingsBtn.addEventListener('click', () => {
                this.loadRecordings();
            });
        }
        
        // Modal controls
        if (this.modalClose) {
            this.modalClose.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        if (this.cancelSave) {
            this.cancelSave.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        if (this.confirmSave) {
            this.confirmSave.addEventListener('click', () => {
                this.saveRecording();
            });
        }
        
        // Close modal on overlay click
        if (this.saveModal) {
            this.saveModal.addEventListener('click', (e) => {
                if (e.target === this.saveModal) {
                    this.closeModal();
                }
            });
        }
    }
    
    /**
     * Toggle recording on/off
     */
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    /**
     * Start recording simulation
     */
    startRecording() {
        if (this.isRecording) return;
        
        this.isRecording = true;
        this.recordedGenerations = [];
        this.recordingStartTime = Date.now();
        
        // Record initial state
        this.recordGeneration();
        
        // Update UI
        this.updateRecordingUI();
        
        console.log('🔴 Recording started');
    }
    
    /**
     * Stop recording simulation
     */
    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        this.recordingStartTime = null;
        
        // Update UI
        this.updateRecordingUI();
        
        console.log(`🛑 Recording stopped (${this.recordedGenerations.length} generations)`);
    }
    
    /**
     * Record current generation state
     */
    recordGeneration() {
        if (!this.isRecording) return;
        
        const snapshot = this.game.engine.getGridSnapshot();
        this.recordedGenerations.push({
            timestamp: Date.now() - this.recordingStartTime,
            generation: snapshot.generation,
            grid: snapshot.grid.map(row => [...row]), // Deep copy
            population: snapshot.population
        });
    }
    
    /**
     * Finish recording and prepare for saving
     */
    finishRecording() {
        if (!this.isRecording) {
            alert('No active recording to finish!');
            return;
        }
        
        this.stopRecording();
        
        if (this.recordedGenerations.length === 0) {
            alert('No generation data recorded!');
            return;
        }
        
        // Show save modal
        this.openSaveModal();
    }
    
    /**
     * Update recording UI state
     */
    updateRecordingUI() {
        if (!this.recordBtn || !this.finishBtn) return;
        
        if (this.isRecording) {
            this.recordBtn.classList.add('recording');
            this.recordBtn.title = 'Stop Recording';
            
            const recordIcon = this.recordBtn.querySelector('.btn-icon');
            if (recordIcon) {
                recordIcon.setAttribute('data-lucide', 'square');
            }
            
            this.finishBtn.style.display = 'block';
            this.finishBtn.disabled = false;
        } else {
            this.recordBtn.classList.remove('recording');
            this.recordBtn.title = 'Start Recording';
            
            const recordIcon = this.recordBtn.querySelector('.btn-icon');
            if (recordIcon) {
                recordIcon.setAttribute('data-lucide', 'circle');
            }
            
            if (this.recordedGenerations.length > 0) {
                this.finishBtn.style.display = 'block';
                this.finishBtn.disabled = false;
            } else {
                this.finishBtn.style.display = 'none';
                this.finishBtn.disabled = true;
            }
        }
        
        // Update icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Setup timeline for recorded data
     */
    setupTimeline() {
        if (!this.replayData || this.replayData.length === 0) {
            console.warn('No replay data to setup timeline');
            return;
        }
        
        // Show timeline section
        if (this.timelineSection) {
            this.timelineSection.style.display = 'block';
        }
        
        // Setup slider
        if (this.timelineSlider) {
            this.timelineSlider.min = '0';
            this.timelineSlider.max = (this.replayData.length - 1).toString();
            this.timelineSlider.value = '0';
        }
        
        // Update info
        this.replayIndex = 0;
        this.updateTimelineInfo();
        
        // Show first frame
        this.showReplayFrame(0);
        
        console.log(`⏯️ Timeline setup with ${this.replayData.length} frames`);
    }
    
    /**
     * Play timeline
     */
    playTimeline() {
        if (!this.replayData || this.replayData.length === 0) return;
        
        this.isReplaying = true;
        this.updateTimelineUI();
        
        // Clear any existing interval
        if (this.replayInterval) {
            clearInterval(this.replayInterval);
        }
        
        // Start playback
        const intervalMs = Math.max(100, 1000 / this.replaySpeed);
        this.replayInterval = setInterval(() => {
            this.nextFrame();
        }, intervalMs);
        
        console.log(`▶️ Timeline playback started at ${this.replaySpeed}x speed`);
    }
    
    /**
     * Pause timeline
     */
    pauseTimeline() {
        this.isReplaying = false;
        this.updateTimelineUI();
        
        if (this.replayInterval) {
            clearInterval(this.replayInterval);
            this.replayInterval = null;
        }
        
        console.log('⏸️ Timeline playback paused');
    }
    
    /**
     * Stop timeline
     */
    stopTimeline() {
        this.isReplaying = false;
        this.replayIndex = 0;
        this.updateTimelineUI();
        this.updateTimelineInfo();
        
        if (this.replayInterval) {
            clearInterval(this.replayInterval);
            this.replayInterval = null;
        }
        
        // Show first frame
        if (this.replayData && this.replayData.length > 0) {
            this.showReplayFrame(0);
        }
        
        console.log('⏹️ Timeline playback stopped');
    }
    
    /**
     * Seek to specific frame
     */
    seekTimeline(frameIndex) {
        if (!this.replayData || frameIndex < 0 || frameIndex >= this.replayData.length) {
            return;
        }
        
        this.replayIndex = frameIndex;
        this.showReplayFrame(frameIndex);
        this.updateTimelineInfo();
    }
    
    /**
     * Advance to next frame
     */
    nextFrame() {
        if (!this.replayData) return;
        
        this.replayIndex++;
        
        if (this.replayIndex >= this.replayData.length) {
            // End of timeline
            this.pauseTimeline();
            this.replayIndex = this.replayData.length - 1;
            return;
        }
        
        this.showReplayFrame(this.replayIndex);
        this.updateTimelineInfo();
    }
    
    /**
     * Show specific replay frame
     */
    showReplayFrame(frameIndex) {
        if (!this.replayData || frameIndex < 0 || frameIndex >= this.replayData.length) {
            return;
        }
        
        const frame = this.replayData[frameIndex];
        
        // Restore grid state
        this.game.engine.grid = frame.grid.map(row => [...row]);
        this.game.engine.generation = frame.generation || frameIndex;
        
        // Update display
        this.game.draw();
        this.game.updateInfo();
        
        // Update slider
        if (this.timelineSlider) {
            this.timelineSlider.value = frameIndex.toString();
        }
    }
    
    /**
     * Update timeline UI state
     */
    updateTimelineUI() {
        if (!this.playTimelineBtn || !this.pauseTimelineBtn) return;
        
        if (this.isReplaying) {
            this.playTimelineBtn.style.display = 'none';
            this.pauseTimelineBtn.style.display = 'block';
        } else {
            this.playTimelineBtn.style.display = 'block';
            this.pauseTimelineBtn.style.display = 'none';
        }
    }
    
    /**
     * Update timeline info display
     */
    updateTimelineInfo() {
        if (this.currentFrame) {
            this.currentFrame.textContent = (this.replayIndex + 1).toString();
        }
        
        if (this.totalFrames && this.replayData) {
            this.totalFrames.textContent = this.replayData.length.toString();
        }
    }
    
    /**
     * Open save modal
     */
    openSaveModal() {
        if (!this.saveModal) return;
        
        this.saveModal.style.display = 'flex';
        
        if (this.recordingName) {
            this.recordingName.focus();
            this.recordingName.select();
        }
    }
    
    /**
     * Close save modal
     */
    closeModal() {
        if (this.saveModal) {
            this.saveModal.style.display = 'none';
        }
        
        if (this.recordingName) {
            this.recordingName.value = '';
        }
    }
    
    /**
     * Save recording to server
     */
    async saveRecording() {
        const name = this.recordingName?.value?.trim();
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
                    cellSize: this.game.cellSize,
                    rows: this.game.rows,
                    cols: this.game.cols,
                    speed: this.game.speed,
                    customRules: {
                        birthRules: [...this.game.engine.birthRules],
                        survivalRules: [...this.game.engine.survivalRules]
                    }
                },
                metadata: {
                    totalGenerations: this.recordedGenerations.length,
                    duration: this.recordedGenerations[this.recordedGenerations.length - 1]?.timestamp || 0,
                    ruleString: this.game.engine.getRulesAsString()
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
                
                // Clear recorded data
                this.recordedGenerations = [];
                this.updateRecordingUI();
            } else {
                throw new Error(result.error || 'Failed to save recording');
            }
            
        } catch (error) {
            console.error('Error saving recording:', error);
            alert('Failed to save recording: ' + error.message);
        }
    }
    
    /**
     * Load recordings from server
     */
    async loadRecordings() {
        try {
            const response = await fetch('/api/recordings');
            const recordings = await response.json();
            
            this.displayRecordings(recordings);
            
        } catch (error) {
            console.error('Error loading recordings:', error);
            if (this.recordingsList) {
                this.recordingsList.innerHTML = '<p class="no-recordings">Failed to load recordings</p>';
            }
        }
    }
    
    /**
     * Display recordings in UI
     */
    displayRecordings(recordings) {
        if (!this.recordingsList) return;
        
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
                        ${recording.ruleString ? `• ${recording.ruleString}` : ''}
                    </div>
                </div>
                <div class="recording-actions">
                    <button class="play-recording-btn" onclick="game.recordingManager.playRecording('${recording.id}')">
                        <i data-lucide="play" style="width: 12px; height: 12px;"></i>
                        Play
                    </button>
                    <button class="delete-recording-btn" onclick="game.recordingManager.deleteRecording('${recording.id}', '${recording.name}')">
                        <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        // Re-create Lucide icons for the dynamically added buttons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Play a specific recording
     */
    async playRecording(recordingId) {
        try {
            const response = await fetch(`/api/recordings/${recordingId}`);
            const recording = await response.json();
            
            if (!response.ok) {
                throw new Error(recording.error || 'Failed to load recording');
            }
            
            // Stop any current activity
            if (this.game.isRunning) {
                this.game.toggleSimulation();
            }
            if (this.isReplaying) {
                this.stopTimeline();
            }
            
            // Apply recording settings if available
            if (recording.settings) {
                if (recording.settings.customRules) {
                    this.game.engine.setBirthRules(recording.settings.customRules.birthRules);
                    this.game.engine.setSurvivalRules(recording.settings.customRules.survivalRules);
                    this.game.updateRuleDisplay();
                    this.game.updateCheckboxesFromRules();
                }
            }
            
            // Set up replay data
            this.replayData = recording.generations;
            this.setupTimeline();
            
            // Auto-play the recording
            setTimeout(() => {
                this.playTimeline();
            }, 500);
            
            console.log(`🎬 Playing recording: ${recordingId}`);
            
        } catch (error) {
            console.error('Error playing recording:', error);
            alert('Failed to play recording: ' + error.message);
        }
    }
    
    /**
     * Delete a recording
     */
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
    
    /**
     * Check if currently recording and record generation if needed
     * Called by the main game loop
     */
    onGenerationUpdate() {
        if (this.isRecording) {
            this.recordGeneration();
        }
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        if (this.replayInterval) {
            clearInterval(this.replayInterval);
        }
        
        this.isRecording = false;
        this.isReplaying = false;
        this.recordedGenerations = [];
        this.replayData = null;
        
        console.log('🎬 RecordingManager destroyed');
    }
}
