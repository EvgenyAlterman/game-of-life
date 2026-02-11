import type {
  RecordingFrame,
  RecordingListItem,
} from './types/game-types.js';

import { EventBus } from './core/event-bus';
import { DomRegistry } from './core/dom-registry';

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

  public isRecording = false;
  public recordedGenerations: RecordingFrame[] = [];
  public recordingStartTime: number | null = null;

  public isReplaying = false;
  public replayData: RecordingFrame[] | null = null;
  public replayIndex = 0;
  public replaySpeed = 5;
  public replayInterval: ReturnType<typeof setInterval> | null = null;

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
    // nothing to cache — we look up elements as needed via dom.get
  }

  private setupEventListeners(): void {
    this.el('recordBtn')?.addEventListener('click', () => this.toggleRecording());
    this.el('finishBtn')?.addEventListener('click', () => this.finishRecording());
    this.el('playTimelineBtn')?.addEventListener('click', () => this.playTimeline());
    this.el('pauseTimelineBtn')?.addEventListener('click', () => this.pauseTimeline());
    this.el('stopTimelineBtn')?.addEventListener('click', () => this.stopTimeline());

    const slider = this.dom.get<HTMLInputElement>('timelineSlider');
    slider?.addEventListener('input', (e) => {
      this.seekTimeline(parseInt((e.target as HTMLInputElement).value, 10));
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

    // Compact timeline bar play button
    this.el('timelinePlayBtn')?.addEventListener('click', () => {
      if (this.isReplaying) {
        this.pauseTimeline();
      } else {
        this.playTimeline();
      }
    });

    const speed = this.dom.get<HTMLInputElement>('playbackSpeed');
    speed?.addEventListener('input', (e) => {
      this.replaySpeed = parseInt((e.target as HTMLInputElement).value, 10);
      const sv = this.el('speedValue');
      if (sv) sv.textContent = (e.target as HTMLInputElement).value + 'x';
    });

    this.el('loadRecordingsBtn')?.addEventListener('click', () => this.loadRecordings());
    this.el('modalClose')?.addEventListener('click', () => this.closeModal());
    this.el('cancelSave')?.addEventListener('click', () => this.closeModal());
    this.el('confirmSave')?.addEventListener('click', () => this.saveRecording());

    const modal = this.el('saveModal');
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) this.closeModal();
    });

    // Listen for simulation stop to show compact timeline if we have replay data
    this.bus.on('simulation:stop', () => this.updateCompactTimelineVisibility());
    this.bus.on('simulation:start', () => this.hideCompactTimeline());
  }

  // ---- Recording ----

  toggleRecording(): void {
    if (this.isRecording) this.stopRecording();
    else this.startRecording();
  }

  startRecording(): void {
    if (this.isRecording) return;
    this.isRecording = true;
    this.recordedGenerations = [];
    this.recordingStartTime = Date.now();
    this.recordGeneration();
    this.updateRecordingUI();
    this.bus.emit('recording:started');
  }

  stopRecording(): void {
    if (!this.isRecording) return;
    this.isRecording = false;
    this.recordingStartTime = null;
    this.updateRecordingUI();
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
  }

  finishRecording(): void {
    if (!this.isRecording) return;
    this.stopRecording();
    if (this.recordedGenerations.length === 0) return;
    this.openSaveModal();
  }

  private updateRecordingUI(): void {
    const recordBtn = this.el('recordBtn');
    const finishBtn = this.el('finishBtn');
    if (!recordBtn || !finishBtn) return;

    if (this.isRecording) {
      recordBtn.classList.add('recording');
      recordBtn.title = 'Stop Recording';
      const icon = recordBtn.querySelector('.btn-icon');
      if (icon) icon.setAttribute('data-lucide', 'square');
      finishBtn.style.display = 'block';
      (finishBtn as HTMLButtonElement).disabled = false;
    } else {
      recordBtn.classList.remove('recording');
      recordBtn.title = 'Start Recording';
      const icon = recordBtn.querySelector('.btn-icon');
      if (icon) icon.setAttribute('data-lucide', 'circle');
      if (this.recordedGenerations.length > 0) {
        finishBtn.style.display = 'block';
        (finishBtn as HTMLButtonElement).disabled = false;
      } else {
        finishBtn.style.display = 'none';
        (finishBtn as HTMLButtonElement).disabled = true;
      }
    }

    this.tryCreateIcons();
  }

  onGenerationUpdate(): void {
    if (this.isRecording) this.recordGeneration();
  }

  // ---- Timeline / replay ----

  setupTimeline(): void {
    if (!this.replayData || this.replayData.length === 0) return;

    const section = this.el('timelineSection');
    if (section) section.style.display = 'block';

    const slider = this.dom.get<HTMLInputElement>('timelineSlider');
    if (slider) {
      slider.min = '0';
      slider.max = String(this.replayData.length - 1);
      slider.value = '0';
    }

    this.replayIndex = 0;
    this.updateTimelineInfo();
    this.showReplayFrame(0);

    // Show compact timeline bar
    this.showCompactTimeline();
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

    const slider = this.dom.get<HTMLInputElement>('timelineSlider');
    if (slider) slider.value = String(idx);
  }

  private updateTimelineUI(): void {
    const play = this.el('playTimelineBtn');
    const pause = this.el('pauseTimelineBtn');
    if (play && pause) {
      play.style.display = this.isReplaying ? 'none' : 'block';
      pause.style.display = this.isReplaying ? 'block' : 'none';
    }

    // Update compact timeline play button
    this.updateCompactPlayButton();
  }

  private updateTimelineInfo(): void {
    const cf = this.el('currentFrame');
    if (cf) cf.textContent = String(this.replayIndex + 1);
    const tf = this.el('totalFrames');
    if (tf && this.replayData) tf.textContent = String(this.replayData.length);

    // Update compact timeline bar
    this.updateCompactTimelineInfo();
  }

  // ---- Compact Timeline Bar ----

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

  private updateCompactTimelineVisibility(): void {
    const data = this.getTimelineData();
    if (data && data.length > 0) {
      // If we have recorded generations but no replay data, set up replay from recordings
      if (!this.replayData && this.recordedGenerations.length > 0) {
        this.replayData = this.recordedGenerations;
        this.replayIndex = this.recordedGenerations.length - 1; // Start at end
      }
      this.showCompactTimeline();
    }
  }

  private showCompactTimeline(): void {
    const bar = this.el('timelineBarCompact');
    if (bar) bar.style.display = 'flex';
    this.setupCompactTimeline();
  }

  private hideCompactTimeline(): void {
    const bar = this.el('timelineBarCompact');
    if (bar) bar.style.display = 'none';
  }

  private setupCompactTimeline(): void {
    const data = this.getTimelineData();
    if (!data || data.length === 0) return;

    const slider = this.dom.get<HTMLInputElement>('timelineBarSlider');
    if (slider) {
      slider.min = '0';
      slider.max = String(data.length - 1);
      slider.value = String(this.replayIndex);
    }

    this.updateCompactTimelineInfo();
  }

  private updateCompactTimelineInfo(): void {
    const data = this.getTimelineData();
    const frameEl = this.el('timelineBarFrame');
    if (frameEl && data) {
      frameEl.textContent = `${this.replayIndex + 1} / ${data.length}`;
    }

    // Sync slider position and progress line
    const slider = this.dom.get<HTMLInputElement>('timelineBarSlider');
    if (slider && data) {
      slider.value = String(this.replayIndex);
      const progress = data.length > 1 ? (this.replayIndex / (data.length - 1)) * 100 : 0;
      slider.style.setProperty('--progress', `${progress}%`);
    }

    // Update play button icon
    this.updateCompactPlayButton();
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
    if (!name || this.recordedGenerations.length === 0) return;

    const data = {
      generations: this.recordedGenerations,
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
        totalGenerations: this.recordedGenerations.length,
        duration: this.recordedGenerations[this.recordedGenerations.length - 1]?.timestamp ?? 0,
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
        this.recordedGenerations = [];
        this.updateRecordingUI();
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
          <button class="play-recording-btn" title="Play recording" onclick="game.recordingManager.playRecording('${r.id}')"><i data-lucide="play" class="btn-icon"></i></button>
          <button class="delete-recording-btn" title="Delete recording" onclick="game.recordingManager.deleteRecording('${r.id}', '${r.name}')"><i data-lucide="trash-2" class="btn-icon"></i></button>
        </div>
      </div>`,
      )
      .join('');

    this.tryCreateIcons();
  }

  async playRecording(recordingId: string): Promise<void> {
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
      this.setupTimeline();
      setTimeout(() => this.playTimeline(), 500);
    } catch (err: any) {
      console.error('Error playing recording:', err);
    }
  }

  async deleteRecording(recordingId: string, name: string): Promise<void> {
    if (!confirm(`Delete "${name}"?`)) return;
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
