/**
 * Translates mouse/keyboard events on the canvas into semantic actions.
 */

import type { EventBus } from '../core/event-bus';
import type { CanvasRenderer } from './canvas-renderer';
import type { DrawingToolsManager } from './drawing-tools';
import type { InspectorManager } from './inspector';
import type { GameOfLifeEngine } from '../js/game-engine';

export interface EraserConfig {
  brushSize: number;
  brushShape: 'circle' | 'square';
}

export class InputHandler {
  private bus: EventBus;
  private renderer: CanvasRenderer;
  private tools: DrawingToolsManager;
  private inspector: InspectorManager;
  private engine: GameOfLifeEngine;

  private isDrawing = false;
  private isSelecting = false;
  private selectionStart: { row: number; col: number } | null = null;
  private selectionEnd: { row: number; col: number } | null = null;
  private previewPosition: { row: number; col: number } | null = null;
  private showPreview = false;

  eraser: EraserConfig = { brushSize: 3, brushShape: 'circle' };

  // Callbacks for operations that need external coordination
  onUpdateInfo: () => void = () => {};
  onSaveSettings: () => void = () => {};
  onShowSavePatternModal: () => void = () => {};
  onHasValidSelection: () => boolean = () => false;
  onGetRotatedPattern: (pattern: number[][], degrees: number) => number[][] = (p) => p;

  isRunning = false;

  constructor(
    bus: EventBus,
    renderer: CanvasRenderer,
    tools: DrawingToolsManager,
    inspector: InspectorManager,
    engine: GameOfLifeEngine,
  ) {
    this.bus = bus;
    this.renderer = renderer;
    this.tools = tools;
    this.inspector = inspector;
    this.engine = engine;
  }

  attach(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('mousedown', (e) => {
      if (this.isRunning) return;
      this.handleMouseDown(e);
    });
    canvas.addEventListener('mousemove', (e) => {
      if (this.isRunning) return;
      this.handleMouseMove(e);
    });
    canvas.addEventListener('mouseup', (e) => {
      if (this.isRunning) return;
      this.handleMouseUp(e);
    });
    canvas.addEventListener('mouseleave', () => {
      if (this.isRunning) return;
      this.handleMouseLeave();
    });
  }

  getSelectionStart() { return this.selectionStart; }
  getSelectionEnd() { return this.selectionEnd; }

  clearSelection(): void {
    this.selectionStart = null;
    this.selectionEnd = null;
    this.isSelecting = false;
    this.renderer.setSelection(null, false);
  }

  clearPatternPreview(): void {
    if (this.showPreview) {
      this.showPreview = false;
      this.previewPosition = null;
      this.renderer.setPatternPreview(null);
      this.bus.emit('canvas:needsRedraw');
    }
  }

  // ─── Mouse handlers ─────────────────────────────────────

  private handleMouseDown(e: MouseEvent): void {
    const { row, col } = this.pixelToCell(e);

    if (this.tools.selectionMode) {
      this.isSelecting = true;
      this.selectionStart = { row, col };
      this.selectionEnd = { row, col };
      this.updateSelectionOverlay();
      this.bus.emit('canvas:needsRedraw');
    } else if (this.tools.mode === 'cell') {
      this.engine.toggleCell(row, col);
      this.bus.emit('canvas:needsRedraw');
      this.onUpdateInfo();
    } else if (this.tools.mode === 'eraser') {
      this.isDrawing = true;
      this.eraseCellsAtPosition(row, col);
    } else if (this.tools.mode === 'inspector') {
      this.inspector.showCellInfo(row, col, e.clientX, e.clientY);
    } else if (this.tools.selectedPattern) {
      this.placePatternAtClick(e);
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.tools.selectionMode && this.isSelecting) {
      const { row, col } = this.pixelToCell(e);
      this.selectionEnd = { row, col };
      this.updateSelectionOverlay();
      this.bus.emit('canvas:needsRedraw');
    } else if (this.tools.mode === 'eraser' && this.isDrawing) {
      const { row, col } = this.pixelToCell(e);
      this.eraseCellsAtPosition(row, col);
    } else if (this.tools.selectedPattern && !this.tools.selectionMode) {
      this.updatePatternPreview(e);
    }
  }

  private handleMouseUp(_e: MouseEvent): void {
    if (this.tools.selectionMode && this.isSelecting) {
      this.isSelecting = false;
      if (this.onHasValidSelection()) {
        this.onShowSavePatternModal();
      }
    } else if (this.tools.mode === 'eraser') {
      this.isDrawing = false;
    }
  }

  private handleMouseLeave(): void {
    if (this.tools.mode === 'eraser') {
      this.isDrawing = false;
    }
    if (this.tools.selectionMode) {
      this.isSelecting = false;
      this.bus.emit('canvas:needsRedraw');
    } else if (this.tools.selectedPattern) {
      this.clearPatternPreview();
    }
  }

  // ─── Actions ────────────────────────────────────────────

  private placePatternAtClick(e: MouseEvent): void {
    if (!this.tools.selectedPattern) return;
    const { row, col } = this.pixelToCell(e);
    const rotated = this.onGetRotatedPattern(this.tools.selectedPattern, this.tools.patternRotation);
    this.engine.placePattern(rotated, row, col);
    this.clearPatternPreview();
    this.bus.emit('canvas:needsRedraw');
    this.onUpdateInfo();
    this.onSaveSettings();
  }

  private eraseCellsAtPosition(centerRow: number, centerCol: number): void {
    const { brushSize: size, brushShape: shape } = this.eraser;
    const rows = this.renderer.rows;
    const cols = this.renderer.cols;

    if (shape === 'circle') {
      for (let dr = -size; dr <= size; dr++) {
        for (let dc = -size; dc <= size; dc++) {
          if (Math.sqrt(dr * dr + dc * dc) <= size) {
            const r = centerRow + dr;
            const c = centerCol + dc;
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
              this.engine.grid[r][c] = false;
            }
          }
        }
      }
    } else {
      const half = Math.floor(size / 2);
      for (let dr = -half; dr <= half; dr++) {
        for (let dc = -half; dc <= half; dc++) {
          const r = centerRow + dr;
          const c = centerCol + dc;
          if (r >= 0 && r < rows && c >= 0 && c < cols) {
            this.engine.grid[r][c] = false;
          }
        }
      }
    }

    this.bus.emit('canvas:needsRedraw');
    this.onUpdateInfo();
  }

  private updatePatternPreview(e: MouseEvent): void {
    if (!this.tools.selectedPattern) return;
    const { row, col } = this.pixelToCell(e);

    if (!this.previewPosition || this.previewPosition.row !== row || this.previewPosition.col !== col) {
      this.previewPosition = { row, col };
      this.showPreview = true;
      const rotated = this.onGetRotatedPattern(this.tools.selectedPattern, this.tools.patternRotation);
      this.renderer.setPatternPreview({ pattern: rotated, row, col });
      this.bus.emit('canvas:needsRedraw');
    }
  }

  private updateSelectionOverlay(): void {
    if (!this.selectionStart || !this.selectionEnd) return;
    const s = this.selectionStart;
    const e = this.selectionEnd;
    this.renderer.setSelection(
      {
        startRow: Math.min(s.row, e.row),
        startCol: Math.min(s.col, e.col),
        endRow: Math.max(s.row, e.row),
        endCol: Math.max(s.col, e.col),
      },
      true,
    );
  }

  private pixelToCell(e: MouseEvent): { row: number; col: number } {
    const rect = this.renderer.getCanvas().getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return this.renderer.getCellFromPixel(x, y);
  }
}
