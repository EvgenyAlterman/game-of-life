import { EventBus } from '../core/event-bus';
import { DomRegistry } from '../core/dom-registry';

export interface AutoStopState {
  enabled: boolean;
  delaySetting: number;
  showNotification: boolean;
}

export class AutoStopManager {
  private bus: EventBus;
  private dom: DomRegistry;
  private engine: { grid: boolean[][]; };

  public enabled = false;
  public delaySetting = 3;
  public showNotification = true;
  public generationHistory: boolean[][][] = [];
  public stableGenerationCount = 0;

  /** Called when auto-stop triggers — host should stop the simulation */
  public onStop: (() => void) | null = null;

  constructor(bus: EventBus, dom: DomRegistry, engine: { grid: boolean[][] }) {
    this.bus = bus;
    this.dom = dom;
    this.engine = engine;
  }

  toggle(): void {
    this.enabled = !this.enabled;
    this.updateUI();
    this.bus.emit('settings:changed');

    if (this.enabled) {
      this.resetHistory();
    }
  }

  updateUI(): void {
    const toggle = this.dom.get<HTMLInputElement>('autoStopToggle');
    if (toggle) {
      const icon = toggle.querySelector('.toolbar-icon');
      if (icon) {
        icon.setAttribute('data-lucide', this.enabled ? 'pause-circle' : 'play-circle');
      }
      toggle.classList.toggle('active', this.enabled);
    }

    const settings = this.dom.get<HTMLElement>('autoStopSettings');
    if (settings) {
      settings.style.display = this.enabled ? 'block' : 'none';
    }

    if (typeof window !== 'undefined' && (window as any).lucide) {
      setTimeout(() => {
        try {
          if ((window as any).lucide) (window as any).lucide.createIcons();
        } catch { /* ignore */ }
      }, 0);
    }
  }

  resetHistory(): void {
    this.generationHistory = [];
    this.stableGenerationCount = 0;
  }

  captureCurrentGeneration(): boolean[][] {
    const grid = this.engine.grid;
    const rows = grid.length;
    const snapshot: boolean[][] = [];
    for (let r = 0; r < rows; r++) {
      snapshot[r] = [];
      for (let c = 0; c < grid[r].length; c++) {
        snapshot[r][c] = grid[r][c];
      }
    }
    return snapshot;
  }

  static compareGenerations(g1: boolean[][] | null, g2: boolean[][] | null): boolean {
    if (!g1 || !g2) return false;
    if (g1.length !== g2.length) return false;
    for (let r = 0; r < g1.length; r++) {
      if (!g1[r] || !g2[r]) return false;
      if (g1[r].length !== g2[r].length) return false;
      for (let c = 0; c < g1[r].length; c++) {
        if (g1[r][c] !== g2[r][c]) return false;
      }
    }
    return true;
  }

  /**
   * Called each tick to check if the grid has stabilised.
   * Detects static patterns (no change) and oscillators (period up to 10).
   * Returns true if auto-stop was triggered.
   */
  check(): boolean {
    if (!this.enabled) return false;

    const current = this.captureCurrentGeneration();

    // Check if current matches any recent generation (static or oscillator)
    let isStable = false;
    for (const past of this.generationHistory) {
      if (AutoStopManager.compareGenerations(current, past)) {
        isStable = true;
        break;
      }
    }

    // Keep a small window for oscillator period detection (up to period 10)
    this.generationHistory.push(current);
    while (this.generationHistory.length > 10) {
      this.generationHistory.shift();
    }

    if (isStable) {
      this.stableGenerationCount++;
      if (this.stableGenerationCount >= this.delaySetting) {
        this.trigger();
        return true;
      }
    } else {
      this.stableGenerationCount = 0;
    }

    return false;
  }

  private trigger(): void {
    if (this.showNotification) {
      AutoStopManager.showNotification();
    }
    this.resetHistory();
    this.bus.emit('autostop:triggered', { generation: 0 });
    if (this.onStop) this.onStop();
  }

  static showNotification(): void {
    const el = document.createElement('div');
    el.className = 'autostop-notification';
    el.style.cssText = `
      position: fixed; top: 80px; right: 20px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white; padding: 16px 24px; border-radius: 12px;
      font-weight: 600; font-size: 14px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      z-index: 10000; max-width: 300px;
      border: 2px solid rgba(255,255,255,0.2);
    `;
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:18px;">&#9199;&#65039;</span>
        <div>
          <div style="font-weight:700;margin-bottom:4px;">Auto-Stop Triggered</div>
          <div style="font-size:12px;opacity:0.9;">Stable state detected</div>
        </div>
      </div>`;
    document.body.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 4300);
  }

  getState(): AutoStopState {
    return {
      enabled: this.enabled,
      delaySetting: this.delaySetting,
      showNotification: this.showNotification,
    };
  }

  loadState(s: Partial<AutoStopState>): void {
    if (s.enabled !== undefined) this.enabled = s.enabled;
    if (s.delaySetting !== undefined) this.delaySetting = s.delaySetting;
    if (s.showNotification !== undefined) this.showNotification = s.showNotification;
    this.updateUI();

    // Sync delay slider and notification checkbox with loaded values
    const delaySlider = this.dom.get<HTMLInputElement>('autoStopDelay');
    const delayValue = this.dom.get('autoStopDelayValue');
    const notifCheckbox = this.dom.get<HTMLInputElement>('autoStopNotification');
    if (delaySlider && s.delaySetting !== undefined) delaySlider.value = String(s.delaySetting);
    if (delayValue && s.delaySetting !== undefined) delayValue.textContent = String(s.delaySetting);
    if (notifCheckbox && s.showNotification !== undefined) notifCheckbox.checked = s.showNotification;
  }

  setDelay(value: number): void {
    this.delaySetting = value;
  }

  setShowNotification(value: boolean): void {
    this.showNotification = value;
  }
}
