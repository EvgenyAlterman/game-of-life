/**
 * Rectangle selection, pattern extraction, and save-pattern modal.
 */

import type { EventBus } from '../core/event-bus';
import type { DomRegistry } from '../core/dom-registry';
import type { GameOfLifeEngine } from '../js/game-engine';
import type { CanvasRenderer } from './canvas-renderer';
import type { PatternManager } from './pattern-manager';
import type { SelectionBounds } from '../types/game-types';

export interface ExtractedPattern {
  pattern: number[][];
  width: number;
  height: number;
  activeCells: number;
}

export class SelectionManager {
  private bus: EventBus;
  private dom: DomRegistry;
  private engine: GameOfLifeEngine;
  private renderer: CanvasRenderer;
  private patterns: PatternManager;

  private selectedPatternData: ExtractedPattern | null = null;

  constructor(
    bus: EventBus,
    dom: DomRegistry,
    engine: GameOfLifeEngine,
    renderer: CanvasRenderer,
    patterns: PatternManager,
  ) {
    this.bus = bus;
    this.dom = dom;
    this.engine = engine;
    this.renderer = renderer;
    this.patterns = patterns;
  }

  hasValidSelection(start: { row: number; col: number } | null, end: { row: number; col: number } | null): boolean {
    return !!(start && end && (start.row !== end.row || start.col !== end.col));
  }

  getSelectionBounds(start: { row: number; col: number } | null, end: { row: number; col: number } | null): SelectionBounds | null {
    if (!start || !end) return null;
    return {
      startRow: Math.min(start.row, end.row),
      endRow: Math.max(start.row, end.row),
      startCol: Math.min(start.col, end.col),
      endCol: Math.max(start.col, end.col),
    };
  }

  extractPattern(bounds: SelectionBounds): ExtractedPattern {
    const pattern: number[][] = [];
    let activeCells = 0;

    for (let row = bounds.startRow; row <= bounds.endRow; row++) {
      const patternRow: number[] = [];
      for (let col = bounds.startCol; col <= bounds.endCol; col++) {
        const isAlive = this.engine.getCell(row, col);
        patternRow.push(isAlive ? 1 : 0);
        if (isAlive) activeCells++;
      }
      pattern.push(patternRow);
    }

    return {
      pattern,
      width: bounds.endCol - bounds.startCol + 1,
      height: bounds.endRow - bounds.startRow + 1,
      activeCells,
    };
  }

  showSaveModal(start: { row: number; col: number } | null, end: { row: number; col: number } | null): void {
    const bounds = this.getSelectionBounds(start, end);
    if (!bounds) return;

    const data = this.extractPattern(bounds);
    this.selectedPatternData = data;

    const sizeEl = this.dom.get('patternSize');
    const cellsEl = this.dom.get('patternCells');
    const nameEl = this.dom.get<HTMLInputElement>('patternName');
    const catEl = this.dom.get<HTMLSelectElement>('patternCategory');
    const previewCanvas = this.dom.get<HTMLCanvasElement>('patternPreviewCanvas');
    const modal = this.dom.get('savePatternModal');

    if (sizeEl) sizeEl.textContent = `${data.width}×${data.height}`;
    if (cellsEl) cellsEl.textContent = String(data.activeCells);
    if (nameEl) nameEl.value = '';
    if (catEl) catEl.value = 'custom';
    if (previewCanvas) {
      this.renderer.drawPatternPreviewInModal(previewCanvas, data.pattern);
    }
    if (modal) modal.style.display = 'block';
    if (nameEl) setTimeout(() => nameEl.focus(), 100);
  }

  closeSaveModal(): void {
    const modal = this.dom.get('savePatternModal');
    if (modal) modal.style.display = 'none';
    this.selectedPatternData = null;
    this.bus.emit('canvas:needsRedraw');
  }

  saveSelectedPattern(): boolean {
    const nameEl = this.dom.get<HTMLInputElement>('patternName');
    const catEl = this.dom.get<HTMLSelectElement>('patternCategory');
    const name = nameEl?.value.trim();

    if (!name || !this.selectedPatternData) return false;

    const category = catEl?.value || 'custom';
    this.patterns.saveCustomPattern({
      name,
      category,
      pattern: this.selectedPatternData.pattern,
    });

    this.closeSaveModal();
    return true;
  }
}
