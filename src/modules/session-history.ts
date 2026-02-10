import { EventBus } from '../core/event-bus';

export interface SessionFrame {
  generation: number;
  population: number;
  grid: { grid: boolean[][]; generation?: number } | null;
}

export interface SessionEngine {
  generation: number;
  getPopulation(): number;
  getGridSnapshot(): { grid: boolean[][]; generation?: number } | null;
  restoreFromSnapshot(snapshot: { grid: boolean[][]; generation?: number } | null): void;
}

export class SessionHistoryManager {
  private _bus: EventBus;
  private engine: SessionEngine;

  public history: SessionFrame[] = [];
  public replayIndex = 0;
  public isReplaying = false;
  public timelineVisible = false;

  /** Called when state is restored so host can redraw + updateInfo */
  public onStateRestored: (() => void) | null = null;

  constructor(bus: EventBus, engine: SessionEngine) {
    this._bus = bus;
    this.engine = engine;
  }

  addFrame(): void {
    if (this.isReplaying) return;
    const frame: SessionFrame = {
      generation: this.engine.generation,
      population: this.engine.getPopulation(),
      grid: this.engine.getGridSnapshot(),
    };
    this.history.push(frame);
    this.replayIndex = this.history.length - 1;
  }

  showTimeline(): void {
    if (this.timelineVisible || this.history.length <= 1) return;

    const el = document.createElement('div');
    el.id = 'sessionTimeline';
    el.className = 'session-timeline';
    el.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      background: var(--bg-secondary); border: 1px solid var(--border);
      border-radius: 12px; padding: 16px 24px; display: flex;
      align-items: center; gap: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      z-index: 1000; min-width: 400px;
    `;

    const lastIdx = this.history.length - 1;
    el.innerHTML = `
      <span style="font-size:14px;color:var(--text-secondary);white-space:nowrap;">Gen:</span>
      <span id="sessionCurrentGen" style="font-weight:600;color:var(--text-primary);min-width:30px;">${this.engine.generation}</span>
      <input type="range" id="sessionTimelineSlider" min="0" max="${lastIdx}" value="${this.replayIndex}"
        style="flex:1;margin:0 12px;min-width:200px;width:300px;" />
      <span style="font-size:12px;color:var(--text-secondary);">
        <span id="sessionFrameInfo">${this.replayIndex + 1} / ${this.history.length}</span>
      </span>
      <button id="sessionCloseBtn" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;padding:4px;border-radius:4px;" title="Close timeline">&times;</button>
    `;

    document.body.appendChild(el);
    this.timelineVisible = true;

    const slider = document.getElementById('sessionTimelineSlider') as HTMLInputElement | null;
    slider?.addEventListener('input', (e) => {
      this.seek(parseInt((e.target as HTMLInputElement).value, 10));
    });

    document.getElementById('sessionCloseBtn')?.addEventListener('click', () => {
      this.hideTimeline();
    });
  }

  hideTimeline(): void {
    const el = document.getElementById('sessionTimeline');
    if (el) {
      el.remove();
    }
    this.timelineVisible = false;

    if (this.isReplaying) {
      this.exitReplay();
    }
  }

  seek(index: number): void {
    if (index < 0 || index >= this.history.length) return;

    this.replayIndex = index;
    this.isReplaying = true;

    const frame = this.history[index];
    this.engine.restoreFromSnapshot(frame.grid);
    this.engine.generation = frame.generation;

    const genSpan = document.getElementById('sessionCurrentGen');
    if (genSpan) genSpan.textContent = String(frame.generation);

    const info = document.getElementById('sessionFrameInfo');
    if (info) info.textContent = `${index + 1} / ${this.history.length}`;

    if (this.onStateRestored) this.onStateRestored();
  }

  exitReplay(): void {
    if (!this.isReplaying) return;

    if (this.history.length > 0) {
      const latest = this.history[this.history.length - 1];
      this.engine.restoreFromSnapshot(latest.grid);
      this.engine.generation = latest.generation;
      this.replayIndex = this.history.length - 1;
    }

    this.isReplaying = false;
    if (this.onStateRestored) this.onStateRestored();

    // Ensure timeline is hidden
    const el = document.getElementById('sessionTimeline');
    if (el) el.remove();
    this.timelineVisible = false;
  }

  clear(): void {
    this.history = [];
    this.replayIndex = 0;
    this.isReplaying = false;
    this.hideTimeline();
  }
}
