import type {
  RecordingFrame,
  RecordingListItem,
} from './types/game-types.js';

import { EventBus } from './core/event-bus';
import { DomRegistry } from './core/dom-registry';
import { Modal } from './core/modal';

export interface RecordingEngine {
  grid: boolean[][];
  generation: number;
  birthRules: number[];
  survivalRules: number[];
  getGridSnapshot(): { grid: boolean[][]; generation?: number; population?: number };
  getRulesAsString(): string;
  setBirthRules(rules: number[]): void;
  setSurvivalRules(rules: number[]): void;
}

export interface RecordingHost {
  cellSize: number;
  rows: number;
  cols: number;
  speed: number;
  isRunning: boolean;
  draw(): void;
  updateInfo(): void;
  toggleSimulation(): void;
  updateRuleDisplay(): void;
  updateCheckboxesFromRules(): void;
}

export class RecordingManager {
  private bus: EventBus;
  private dom: DomRegistry;
  private engine: RecordingEngine;
  private host: RecordingHost;

  // Auto-recording is always active when simulation runs
  public isRecording = false;
  public recordedGenerations: RecordingFrame[] = [];
  public recordingStartTime: number | null = null;

  // Range selection for saving
  public rangeStart = 0;
  public rangeEnd = 0;

  public isReplaying = false;
  public replayData: RecordingFrame[] | null = null;
  public replayIndex = 0;
  public replaySpeed = 5;
  public replayInterval: ReturnType<typeof setInterval> | null = null;

  // Playback mode (when playing a saved recording)
  public isInPlaybackMode = false;
  public currentPlaybackName: string | null = null;
  public currentPlaybackDate: string | null = null;

  constructor(bus: EventBus, dom: DomRegistry, engine: RecordingEngine, host: RecordingHost) {
    this.bus = bus;
    this.dom = dom;
    this.engine = engine;
    this.host = host;

    this.initializeUI();
    this.setupEventListeners();
  }

  private el(id: string): HTMLElement | null {
    return this.dom.get<HTMLElement>(id);
  }

  private initializeUI(): void {
    // Ensure Lucide icons are created for timeline buttons after DOM is ready
    setTimeout(() => this.tryCreateIcons(), 100);
  }

  private setupEventListeners(): void {
    // Timeline play/pause button (compact bar)
    this.el('timelinePlayBtn')?.addEventListener('click', () => {
      if (this.isReplaying) {
        this.pauseTimeline();
      } else {
        this.playTimeline();
      }
    });

    // Compact timeline bar slider
    const compactSlider = this.dom.get<HTMLInputElement>('timelineBarSlider');
    compactSlider?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const value = parseInt(target.value, 10);
      this.seekTimeline(value);
      // Update progress line immediately for smooth dragging
      const max = parseInt(target.max, 10) || 1;
      const progress = max > 0 ? (value / max) * 100 : 0;
      target.style.setProperty('--progress', `${progress}%`);
    });

    // New buttons: Save, Reset, and Close playback
    this.el('saveRecordingBtn')?.addEventListener('click', () => this.openSaveModal());
    this.el('resetTimelineBtn')?.addEventListener('click', () => this.clearRecording());
    this.el('closePlaybackBtn')?.addEventListener('click', () => this.exitPlaybackMode());

    this.el('loadRecordingsBtn')?.addEventListener('click', () => this.loadRecordings());
    this.el('modalClose')?.addEventListener('click', () => this.closeModal());
    this.el('cancelSave')?.addEventListener('click', () => this.closeModal());
    this.el('confirmSave')?.addEventListener('click', () => this.saveRecording());

    const modal = this.el('saveModal');
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) this.closeModal();
    });

    // Range selector inputs
    this.setupRangeSelectors();

    // Listen for simulation events - auto-recording integration
    this.bus.on('simulation:stop', () => this.onSimulationStop());
    this.bus.on('simulation:start', () => this.onSimulationStart());
  }

  private setupRangeSelectors(): void {
    const rangeStart = this.dom.get<HTMLInputElement>('rangeStart');
    const rangeEnd = this.dom.get<HTMLInputElement>('rangeEnd');
    const sliderStart = this.dom.get<HTMLInputElement>('rangeSliderStart');
    const sliderEnd = this.dom.get<HTMLInputElement>('rangeSliderEnd');

    // Sync number inputs with sliders
    rangeStart?.addEventListener('input', () => {
      const val = parseInt(rangeStart.value, 10) || 1;
      this.rangeStart = Math.max(0, val - 1);
      if (sliderStart) sliderStart.value = String(val);
      this.updateRangeStats();
    });

    rangeEnd?.addEventListener('input', () => {
      const val = parseInt(rangeEnd.value, 10) || 1;
      this.rangeEnd = Math.max(0, val - 1);
      if (sliderEnd) sliderEnd.value = String(val);
      this.updateRangeStats();
    });

    sliderStart?.addEventListener('input', () => {
      const val = parseInt(sliderStart.value, 10) || 1;
      this.rangeStart = Math.max(0, val - 1);
      if (rangeStart) rangeStart.value = String(val);
      this.updateRangeStats();
    });

    sliderEnd?.addEventListener('input', () => {
      const val = parseInt(sliderEnd.value, 10) || 1;
      this.rangeEnd = Math.max(0, val - 1);
      if (rangeEnd) rangeEnd.value = String(val);
      this.updateRangeStats();
    });
  }

  private updateRangeStats(): void {
    const frameCount = Math.max(0, this.rangeEnd - this.rangeStart + 1);
    const genEl = this.el('recordedGenerations');
    if (genEl) genEl.textContent = String(frameCount);

    // Estimate duration
    const data = this.getTimelineData();
    if (data && data.length > 0 && this.rangeEnd < data.length && this.rangeStart < data.length) {
      const startTime = data[this.rangeStart]?.timestamp ?? 0;
      const endTime = data[this.rangeEnd]?.timestamp ?? 0;
      const duration = (endTime - startTime) / 1000;
      const durEl = this.el('recordingDuration');
      if (durEl) durEl.textContent = `${duration.toFixed(1)}s`;
    }
  }

  // ---- Auto Recording (always on during simulation) ----

  startAutoRecording(): void {
    if (this.isRecording) return;
    // Clear any previous recording when starting fresh
    this.recordedGenerations = [];
    this.isRecording = true;
    this.recordingStartTime = Date.now();
    this.recordGeneration();
    this.updateTimelineUI();
    this.bus.emit('recording:started');
  }

  stopAutoRecording(): void {
    if (!this.isRecording) return;
    this.isRecording = false;
    this.recordingStartTime = null;
    this.bus.emit('recording:stopped');
  }

  recordGeneration(): void {
    if (!this.isRecording) return;
    const snapshot = this.engine.getGridSnapshot();
    this.recordedGenerations.push({
      timestamp: Date.now() - (this.recordingStartTime ?? Date.now()),
      generation: snapshot.generation ?? 0,
      grid: snapshot.grid.map(row => [...row]),
      population: snapshot.population ?? 0,
    });
    // Update live counter in timeline
    this.updateLiveFrameCounter();
  }

  clearRecording(): void {
    this.recordedGenerations = [];
    this.replayData = null;
    this.replayIndex = 0;
    this.rangeStart = 0;
    this.rangeEnd = 0;
    this.updateTimelineState();
    this.bus.emit('recording:cleared');
  }

  onGenerationUpdate(): void {
    if (this.isRecording) this.recordGeneration();
  }

  private onSimulationStart(): void {
    // Auto-start recording when simulation starts
    this.startAutoRecording();
    // Disable timeline controls while running
    this.setTimelineControlsEnabled(false);
  }

  private onSimulationStop(): void {
    // Stop recording
    this.stopAutoRecording();
    // Set up replay data from recorded generations
    if (this.recordedGenerations.length > 0) {
      this.replayData = this.recordedGenerations;
      this.replayIndex = this.recordedGenerations.length - 1;
    }
    // Enable timeline controls
    this.updateTimelineState();
  }

  private updateLiveFrameCounter(): void {
    const frameEl = this.el('timelineBarFrame');
    if (frameEl) {
      frameEl.textContent = `${this.recordedGenerations.length} / ${this.recordedGenerations.length}`;
    }
  }

  private setTimelineControlsEnabled(enabled: boolean): void {
    const playBtn = this.el('timelinePlayBtn') as HTMLButtonElement;
    const saveBtn = this.el('saveRecordingBtn') as HTMLButtonElement;
    const resetBtn = this.el('resetTimelineBtn') as HTMLButtonElement;
    const slider = this.dom.get<HTMLInputElement>('timelineBarSlider');

    if (playBtn) playBtn.disabled = !enabled;
    if (saveBtn) saveBtn.disabled = !enabled;
    if (resetBtn) resetBtn.disabled = !enabled;
    if (slider) slider.disabled = !enabled;
  }

  private updateTimelineState(): void {
    // In playback mode, use replayData; otherwise use recordedGenerations
    const data = this.isInPlaybackMode ? this.replayData : this.recordedGenerations;
    const hasData = data && data.length > 0;
    const isRunning = this.host.isRunning;

    // Enable/disable based on state (always enable in playback mode if we have data)
    const shouldEnable = hasData && (!isRunning || this.isInPlaybackMode);
    this.setTimelineControlsEnabled(shouldEnable);

    // Update slider range
    const slider = this.dom.get<HTMLInputElement>('timelineBarSlider');
    if (slider && data) {
      slider.min = '0';
      slider.max = String(Math.max(0, data.length - 1));
      slider.value = String(this.replayIndex);
      const progress = data.length > 1
        ? (this.replayIndex / (data.length - 1)) * 100
        : 0;
      slider.style.setProperty('--progress', `${progress}%`);
    }

    // Update frame counter
    const frameEl = this.el('timelineBarFrame');
    if (frameEl) {
      if (hasData && data) {
        frameEl.textContent = `${this.replayIndex + 1} / ${data.length}`;
      } else {
        frameEl.textContent = '0 / 0';
      }
    }

    this.tryCreateIcons();
  }

  // ---- Timeline / replay ----

  setupTimeline(): void {
    if (!this.replayData || this.replayData.length === 0) return;

    // Use the compact timeline bar for all playback
    const slider = this.dom.get<HTMLInputElement>('timelineBarSlider');
    if (slider) {
      slider.min = '0';
      slider.max = String(this.replayData.length - 1);
      slider.value = '0';
      slider.style.setProperty('--progress', '0%');
    }

    this.replayIndex = 0;
    this.updateTimelineInfo();
    this.showReplayFrame(0);

    // Update timeline state
    this.updateTimelineState();
  }

  playTimeline(): void {
    // Ensure we have replay data (use recorded generations if needed)
    if (!this.replayData && this.recordedGenerations.length > 0) {
      this.replayData = this.recordedGenerations;
    }
    if (!this.replayData || this.replayData.length === 0) return;

    this.isReplaying = true;
    this.updateTimelineUI();

    if (this.replayInterval) clearInterval(this.replayInterval);
    const ms = Math.max(100, 1000 / this.replaySpeed);
    this.replayInterval = setInterval(() => this.nextFrame(), ms);
  }

  pauseTimeline(): void {
    this.isReplaying = false;
    this.updateTimelineUI();
    if (this.replayInterval) {
      clearInterval(this.replayInterval);
      this.replayInterval = null;
    }
  }

  stopTimeline(): void {
    this.isReplaying = false;
    this.replayIndex = 0;
    this.updateTimelineUI();
    this.updateTimelineInfo();
    if (this.replayInterval) {
      clearInterval(this.replayInterval);
      this.replayInterval = null;
    }
    if (this.replayData && this.replayData.length > 0) {
      this.showReplayFrame(0);
    }
  }

  seekTimeline(idx: number): void {
    if (!this.replayData || idx < 0 || idx >= this.replayData.length) return;
    this.replayIndex = idx;
    this.showReplayFrame(idx);
    this.updateTimelineInfo();
  }

  private nextFrame(): void {
    if (!this.replayData) return;
    this.replayIndex++;
    if (this.replayIndex >= this.replayData.length) {
      this.pauseTimeline();
      this.replayIndex = this.replayData.length - 1;
      return;
    }
    this.showReplayFrame(this.replayIndex);
    this.updateTimelineInfo();
  }

  showReplayFrame(idx: number): void {
    if (!this.replayData || idx < 0 || idx >= this.replayData.length) return;
    const frame = this.replayData[idx];
    this.engine.grid = frame.grid.map(row => [...row]);
    this.engine.generation = frame.generation || idx;
    this.host.draw();
    this.host.updateInfo();

    // Update compact timeline slider
    const slider = this.dom.get<HTMLInputElement>('timelineBarSlider');
    if (slider) {
      slider.value = String(idx);
      const max = parseInt(slider.max, 10) || 1;
      const progress = max > 0 ? (idx / max) * 100 : 0;
      slider.style.setProperty('--progress', `${progress}%`);
    }
  }

  private updateTimelineUI(): void {
    // Update play/pause button icon
    this.updateCompactPlayButton();
  }

  private updateTimelineInfo(): void {
    const data = this.getTimelineData();
    const frameEl = this.el('timelineBarFrame');
    if (frameEl && data) {
      frameEl.textContent = `${this.replayIndex + 1} / ${data.length}`;
    }

    // Update slider
    const slider = this.dom.get<HTMLInputElement>('timelineBarSlider');
    if (slider && data) {
      slider.value = String(this.replayIndex);
      const progress = data.length > 1 ? (this.replayIndex / (data.length - 1)) * 100 : 0;
      slider.style.setProperty('--progress', `${progress}%`);
    }
  }

  // ---- Timeline Data ----

  private getTimelineData(): RecordingFrame[] | null {
    // Use replayData if available (from loaded recording), otherwise use recordedGenerations
    if (this.replayData && this.replayData.length > 0) {
      return this.replayData;
    }
    if (this.recordedGenerations && this.recordedGenerations.length > 0) {
      return this.recordedGenerations;
    }
    return null;
  }

  private updateCompactPlayButton(): void {
    const btn = this.el('timelinePlayBtn');
    if (!btn) return;
    const icon = btn.querySelector('.timeline-bar-icon');
    if (icon) {
      icon.setAttribute('data-lucide', this.isReplaying ? 'pause' : 'play');
      this.tryCreateIcons();
    }
  }

  // ---- Save / Load ----

  private openSaveModal(): void {
    const data = this.getTimelineData();
    if (!data || data.length === 0) return;

    // Initialize range selectors to full range
    this.rangeStart = 0;
    this.rangeEnd = data.length - 1;

    const rangeStart = this.dom.get<HTMLInputElement>('rangeStart');
    const rangeEnd = this.dom.get<HTMLInputElement>('rangeEnd');
    const sliderStart = this.dom.get<HTMLInputElement>('rangeSliderStart');
    const sliderEnd = this.dom.get<HTMLInputElement>('rangeSliderEnd');

    if (rangeStart) {
      rangeStart.min = '1';
      rangeStart.max = String(data.length);
      rangeStart.value = '1';
    }
    if (rangeEnd) {
      rangeEnd.min = '1';
      rangeEnd.max = String(data.length);
      rangeEnd.value = String(data.length);
    }
    if (sliderStart) {
      sliderStart.min = '1';
      sliderStart.max = String(data.length);
      sliderStart.value = '1';
    }
    if (sliderEnd) {
      sliderEnd.min = '1';
      sliderEnd.max = String(data.length);
      sliderEnd.value = String(data.length);
    }

    // Update stats display
    this.updateRangeStats();

    const modal = this.el('saveModal');
    if (!modal) return;
    modal.style.display = 'flex';
    const name = this.dom.get<HTMLInputElement>('recordingName');
    if (name) { name.focus(); name.select(); }
  }

  closeModal(): void {
    const modal = this.el('saveModal');
    if (modal) modal.style.display = 'none';
    const name = this.dom.get<HTMLInputElement>('recordingName');
    if (name) name.value = '';
  }

  async saveRecording(): Promise<void> {
    const nameEl = this.dom.get<HTMLInputElement>('recordingName');
    const name = nameEl?.value?.trim();
    const sourceData = this.getTimelineData();
    if (!name || !sourceData || sourceData.length === 0) return;

    // Use range selection to get subset of frames
    const startIdx = Math.max(0, this.rangeStart);
    const endIdx = Math.min(sourceData.length - 1, this.rangeEnd);
    const selectedFrames = sourceData.slice(startIdx, endIdx + 1);

    if (selectedFrames.length === 0) return;

    const data = {
      generations: selectedFrames,
      settings: {
        cellSize: this.host.cellSize,
        rows: this.host.rows,
        cols: this.host.cols,
        speed: this.host.speed,
        customRules: {
          birthRules: [...this.engine.birthRules],
          survivalRules: [...this.engine.survivalRules],
        },
      },
      metadata: {
        totalGenerations: selectedFrames.length,
        duration: selectedFrames[selectedFrames.length - 1]?.timestamp - (selectedFrames[0]?.timestamp ?? 0),
        ruleString: this.engine.getRulesAsString(),
      },
    };

    try {
      const resp = await fetch('/api/recordings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, data }),
      });
      const result = await resp.json();
      if (resp.ok) {
        this.closeModal();
        this.loadRecordings();
        // Don't clear recordings - user might want to save another range
      } else {
        throw new Error(result.error || 'Failed to save recording');
      }
    } catch (err: any) {
      console.error('Error saving recording:', err);
    }
  }

  async loadRecordings(): Promise<void> {
    try {
      const resp = await fetch('/api/recordings');
      const recordings = await resp.json();
      this.displayRecordings(recordings);
    } catch {
      const list = this.el('recordingsList');
      if (list) list.innerHTML = '<p class="no-recordings">Failed to load recordings</p>';
    }
  }

  displayRecordings(recordings: RecordingListItem[]): void {
    const list = this.el('recordingsList');
    if (!list) return;

    if (!recordings || recordings.length === 0) {
      list.innerHTML = '<p class="no-recordings">No recordings available.</p>';
      return;
    }

    // NOTE: onclick handlers still use window.game.recordingManager for backward compat
    list.innerHTML = recordings
      .map(
        (r) => `
      <div class="recording-item">
        <div class="recording-info">
          <div class="recording-name" title="${r.name}">${r.name}</div>
          <div class="recording-details">${r.totalGenerations} gen &bull; ${r.date}</div>
        </div>
        <div class="recording-actions">
          <button class="play-recording-btn" title="Play recording" onclick="game.recordingManager.playRecording('${r.id}', '${r.name}', '${r.date}')"><i data-lucide="play" class="btn-icon"></i></button>
          <button class="delete-recording-btn" title="Delete recording" onclick="game.recordingManager.deleteRecording('${r.id}', '${r.name}')"><i data-lucide="trash-2" class="btn-icon"></i></button>
        </div>
      </div>`,
      )
      .join('');

    this.tryCreateIcons();
  }

  async playRecording(recordingId: string, name?: string, date?: string): Promise<void> {
    try {
      const resp = await fetch(`/api/recordings/${recordingId}`);
      const recording = await resp.json();
      if (!resp.ok) throw new Error(recording.error || 'Failed to load recording');

      if (this.host.isRunning) this.host.toggleSimulation();
      if (this.isReplaying) this.stopTimeline();

      if (recording.settings?.customRules) {
        this.engine.setBirthRules(recording.settings.customRules.birthRules);
        this.engine.setSurvivalRules(recording.settings.customRules.survivalRules);
        this.host.updateRuleDisplay();
        this.host.updateCheckboxesFromRules();
      }

      this.replayData = recording.generations;
      this.replayIndex = 0;

      // Enter playback mode with recording info
      this.enterPlaybackMode(name || recording.name || 'Recording', date || '');

      // Setup timeline and start playback
      this.updatePlaybackTimeline();
      setTimeout(() => this.playTimeline(), 300);
    } catch (err: any) {
      console.error('Error playing recording:', err);
    }
  }

  // ---- Playback Mode ----

  private enterPlaybackMode(name: string, date: string): void {
    this.isInPlaybackMode = true;
    this.currentPlaybackName = name;
    this.currentPlaybackDate = date;

    // Show recording info
    const infoEl = this.el('timelineRecordingInfo');
    const nameEl = this.el('playbackRecordingName');
    const dateEl = this.el('playbackRecordingDate');
    if (infoEl) infoEl.style.display = 'flex';
    if (nameEl) nameEl.textContent = name;
    if (dateEl) dateEl.textContent = date;

    // Hide normal controls, show close button
    const normalControls = this.el('timelineNormalControls');
    const closeBtn = this.el('closePlaybackBtn');
    if (normalControls) normalControls.style.display = 'none';
    if (closeBtn) closeBtn.style.display = 'flex';

    // Enable timeline controls for playback
    this.setTimelineControlsEnabled(true);

    // Disable simulation controls
    this.setSimulationControlsEnabled(false);

    this.bus.emit('playback:started');
  }

  exitPlaybackMode(): void {
    if (!this.isInPlaybackMode) return;

    // Stop any active playback
    if (this.isReplaying) this.pauseTimeline();

    this.isInPlaybackMode = false;
    this.currentPlaybackName = null;
    this.currentPlaybackDate = null;
    this.replayData = null;
    this.replayIndex = 0;

    // Hide recording info
    const infoEl = this.el('timelineRecordingInfo');
    if (infoEl) infoEl.style.display = 'none';

    // Show normal controls, hide close button
    const normalControls = this.el('timelineNormalControls');
    const closeBtn = this.el('closePlaybackBtn');
    if (normalControls) normalControls.style.display = 'flex';
    if (closeBtn) closeBtn.style.display = 'none';

    // Re-enable simulation controls
    this.setSimulationControlsEnabled(true);

    // Update timeline state (will disable controls if no recorded data)
    this.updateTimelineState();

    this.bus.emit('playback:ended');
  }

  private updatePlaybackTimeline(): void {
    if (!this.replayData || this.replayData.length === 0) return;

    const slider = this.dom.get<HTMLInputElement>('timelineBarSlider');
    if (slider) {
      slider.min = '0';
      slider.max = String(this.replayData.length - 1);
      slider.value = '0';
      slider.style.setProperty('--progress', '0%');
    }

    const frameEl = this.el('timelineBarFrame');
    if (frameEl) {
      frameEl.textContent = `1 / ${this.replayData.length}`;
    }

    // Show first frame
    this.showReplayFrame(0);
  }

  private setSimulationControlsEnabled(enabled: boolean): void {
    const controls = ['startStopBtn', 'resetBtn', 'randomBtn', 'clearBtn'];
    controls.forEach(id => {
      const btn = this.el(id) as HTMLButtonElement;
      if (btn) btn.disabled = !enabled;
    });
  }

  async deleteRecording(recordingId: string, name: string): Promise<void> {
    const confirmed = await Modal.confirm(
      'Delete Recording',
      `Are you sure you want to delete "${name}"?`,
      'Delete',
      'Cancel',
    );
    if (!confirmed) return;
    try {
      const resp = await fetch(`/api/recordings/${recordingId}`, { method: 'DELETE' });
      if (resp.ok) this.loadRecordings();
    } catch (err: any) {
      console.error('Error deleting recording:', err);
    }
  }

  // ---- Lifecycle ----

  private tryCreateIcons(): void {
    if (typeof window !== 'undefined' && (window as any).lucide) {
      try { (window as any).lucide.createIcons(); } catch { /* ignore */ }
    }
  }

  destroy(): void {
    if (this.replayInterval) clearInterval(this.replayInterval);
    this.isRecording = false;
    this.isReplaying = false;
    this.recordedGenerations = [];
    this.replayData = null;
  }
}
