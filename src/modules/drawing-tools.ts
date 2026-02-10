/**
 * Drawing tool mode state machine.
 * Manages which tool is active (cell, inspector, pattern, eraser, selection).
 */

import type { EventBus } from '../core/event-bus';
import type { DomRegistry } from '../core/dom-registry';

declare const lucide: { createIcons: () => void };

export type ToolMode = 'cell' | 'inspector' | 'selection' | 'eraser' | string;

export interface DrawingToolsState {
  mode: ToolMode;
  inspectorMode: boolean;
  selectionMode: boolean;
  selectedPattern: number[][] | null;
  patternRotation: number;
}

export class DrawingToolsManager {
  private bus: EventBus;
  private dom: DomRegistry;

  mode: ToolMode = 'cell';
  inspectorMode = false;
  selectionMode = false;
  selectedPattern: number[][] | null = null;
  patternRotation = 0;

  constructor(bus: EventBus, dom: DomRegistry) {
    this.bus = bus;
    this.dom = dom;
  }

  selectCellMode(): void {
    this.mode = 'cell';
    this.inspectorMode = false;
    this.selectionMode = false;
    this.selectedPattern = null;
    this.patternRotation = 0;
    this.hideEraserSettings();
    this.updateUI();
    this.bus.emit('tool:changed', { mode: 'cell' });
    this.bus.emit('settings:changed');
  }

  selectInspectorMode(): void {
    this.mode = 'inspector';
    this.inspectorMode = true;
    this.selectionMode = false;
    this.selectedPattern = null;
    this.patternRotation = 0;
    this.hideEraserSettings();
    this.updateUI();
    this.bus.emit('tool:changed', { mode: 'inspector' });
    this.bus.emit('settings:changed');
  }

  selectSelectionMode(): void {
    this.mode = 'selection';
    this.inspectorMode = false;
    this.selectionMode = true;
    this.selectedPattern = null;
    this.patternRotation = 0;
    this.hideEraserSettings();
    this.updateUI();
    this.bus.emit('tool:changed', { mode: 'selection' });
    this.bus.emit('settings:changed');
  }

  selectEraserMode(): void {
    this.mode = 'eraser';
    this.inspectorMode = false;
    this.selectionMode = false;
    this.selectedPattern = null;
    this.patternRotation = 0;
    this.showEraserSettings();
    this.updateUI();
    this.bus.emit('tool:changed', { mode: 'eraser' });
    this.bus.emit('settings:changed');
  }

  selectPattern(name: string, pattern: number[][]): void {
    this.mode = name;
    this.inspectorMode = false;
    this.selectionMode = false;
    this.selectedPattern = pattern;
    this.patternRotation = 0;
    this.hideEraserSettings();
    this.updateUI();
    this.bus.emit('tool:changed', { mode: name, pattern: name });
    this.bus.emit('pattern:selected', { name, pattern });
    this.bus.emit('settings:changed');
  }

  selectCustomPattern(name: string, pattern: number[][]): void {
    this.mode = `custom:${name}`;
    this.inspectorMode = false;
    this.selectionMode = false;
    this.selectedPattern = pattern;
    this.patternRotation = 0;
    this.hideEraserSettings();
    this.updateUI();
    this.bus.emit('tool:changed', { mode: `custom:${name}`, pattern: name });
    this.bus.emit('pattern:selected', { name, pattern });
    this.bus.emit('settings:changed');
  }

  getState(): DrawingToolsState {
    return {
      mode: this.mode,
      inspectorMode: this.inspectorMode,
      selectionMode: this.selectionMode,
      selectedPattern: this.selectedPattern,
      patternRotation: this.patternRotation,
    };
  }

  loadState(s: Partial<DrawingToolsState>): void {
    if (s.mode !== undefined) this.mode = s.mode;
    if (s.inspectorMode !== undefined) this.inspectorMode = s.inspectorMode;
    if (s.selectionMode !== undefined) this.selectionMode = s.selectionMode;
    if (s.selectedPattern !== undefined) this.selectedPattern = s.selectedPattern;
    if (s.patternRotation !== undefined) this.patternRotation = s.patternRotation;
    this.updateUI();
  }

  // ─── UI updates ─────────────────────────────────────────

  updateUI(): void {
    // Clear all tool button selections
    document.querySelectorAll('.tool-btn').forEach((btn) => btn.classList.remove('selected'));

    if (this.mode === 'cell') {
      document.getElementById('cellDrawingBtn')?.classList.add('selected');
    } else if (this.mode === 'inspector') {
      document.getElementById('cellInspectorBtn')?.classList.add('selected');
    } else if (this.mode === 'selection') {
      document.getElementById('patternSelectBtn')?.classList.add('selected');
    } else if (this.mode === 'eraser') {
      document.getElementById('eraserBtn')?.classList.add('selected');
    } else {
      document.querySelectorAll('.preset-btn').forEach((btn) => {
        const el = btn as HTMLElement;
        if (el.dataset.pattern === this.mode) {
          el.classList.add('selected');
        }
      });
    }

    // Update cursor
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement | null;
    if (canvas) {
      if (this.mode === 'eraser') {
        canvas.style.cursor = 'grab';
      } else if (this.inspectorMode) {
        canvas.style.cursor = 'help';
      } else {
        canvas.style.cursor = 'crosshair';
      }
    }
  }

  updatePatternHints(getPatternInfo?: (name: string) => { name: string } | null): void {
    let container = document.querySelector('.pattern-hints') as HTMLElement | null;

    if (this.inspectorMode) {
      if (!container) {
        container = document.createElement('div');
        container.className = 'pattern-hints';
        document.querySelector('.info')?.appendChild(container);
      }
      container.innerHTML = `
        <div class="pattern-hint-content">
          <span class="pattern-name">Cell Inspector</span>
          <span class="pattern-controls">hover over cells to see maturity information</span>
        </div>
      `;
      container.style.display = 'block';
    } else if (this.mode !== 'cell' && this.selectedPattern) {
      if (!container) {
        container = document.createElement('div');
        container.className = 'pattern-hints';
        document.querySelector('.info')?.appendChild(container);
      }
      const info = getPatternInfo?.(this.mode);
      const name = info ? info.name : this.mode;
      container.innerHTML = `
        <div class="pattern-hint-content">
          <span class="pattern-name">${name}</span>
          <span class="pattern-controls">
            <kbd>[</kbd> rotate left • <kbd>]</kbd> rotate right • click to place
          </span>
        </div>
      `;
      container.style.display = 'block';
    } else {
      if (container) container.style.display = 'none';
    }
  }

  private hideEraserSettings(): void {
    const settings = this.dom.get('eraserSettings');
    if (settings) settings.style.display = 'none';
  }

  private showEraserSettings(): void {
    const settings = this.dom.get('eraserSettings');
    if (settings) settings.style.display = 'block';
  }
}
