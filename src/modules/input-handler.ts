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
  private isDrawingShape = false;
  private selectionStart: { row: number; col: number } | null = null;
  private selectionEnd: { row: number; col: number } | null = null;
  private shapeStart: { row: number; col: number } | null = null;
  private shapeEnd: { row: number; col: number } | null = null;
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
    const mode = this.tools.mode;

    if (this.tools.selectionMode) {
      this.isSelecting = true;
      this.selectionStart = { row, col };
      this.selectionEnd = { row, col };
      this.updateSelectionOverlay();
      this.bus.emit('canvas:needsRedraw');
    } else if (mode === 'line' || mode === 'rectangle' || mode === 'circle') {
      this.isDrawingShape = true;
      this.shapeStart = { row, col };
      this.shapeEnd = { row, col };
      this.renderer.setShapePreview({ type: mode, startRow: row, startCol: col, endRow: row, endCol: col });
      this.bus.emit('canvas:needsRedraw');
    } else if (mode === 'cell') {
      this.engine.toggleCell(row, col);
      this.bus.emit('canvas:needsRedraw');
      this.onUpdateInfo();
    } else if (mode === 'eraser') {
      this.isDrawing = true;
      this.eraseCellsAtPosition(row, col);
    } else if (mode === 'inspector') {
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
    } else if (this.isDrawingShape && this.shapeStart) {
      const { row, col } = this.pixelToCell(e);
      this.shapeEnd = { row, col };
      const mode = this.tools.mode as 'line' | 'rectangle' | 'circle';
      this.renderer.setShapePreview({
        type: mode,
        startRow: this.shapeStart.row,
        startCol: this.shapeStart.col,
        endRow: row,
        endCol: col,
      });
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
    } else if (this.isDrawingShape && this.shapeStart && this.shapeEnd) {
      this.commitShape();
      this.isDrawingShape = false;
      this.shapeStart = null;
      this.shapeEnd = null;
      this.renderer.setShapePreview(null);
      this.bus.emit('canvas:needsRedraw');
    } else if (this.tools.mode === 'eraser') {
      this.isDrawing = false;
    }
  }

  private handleMouseLeave(): void {
    if (this.tools.mode === 'eraser') {
      this.isDrawing = false;
    }
    if (this.isDrawingShape) {
      this.isDrawingShape = false;
      this.shapeStart = null;
      this.shapeEnd = null;
      this.renderer.setShapePreview(null);
      this.bus.emit('canvas:needsRedraw');
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

  private commitShape(): void {
    if (!this.shapeStart || !this.shapeEnd) return;
    const cells = InputHandler.computeShapeCells(
      this.tools.mode as 'line' | 'rectangle' | 'circle',
      this.shapeStart.row, this.shapeStart.col,
      this.shapeEnd.row, this.shapeEnd.col,
    );
    const rows = this.renderer.rows;
    const cols = this.renderer.cols;
    for (const [r, c] of cells) {
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        this.engine.grid[r][c] = true;
      }
    }
    this.onUpdateInfo();
    this.onSaveSettings();
  }

  static computeShapeCells(
    type: 'line' | 'rectangle' | 'circle',
    r0: number, c0: number, r1: number, c1: number,
  ): [number, number][] {
    switch (type) {
      case 'line': return InputHandler.bresenhamLine(r0, c0, r1, c1);
      case 'rectangle': return InputHandler.rectangleCells(r0, c0, r1, c1);
      case 'circle': return InputHandler.circleCells(r0, c0, r1, c1);
    }
  }

  private static bresenhamLine(r0: number, c0: number, r1: number, c1: number): [number, number][] {
    const cells: [number, number][] = [];
    let dr = Math.abs(r1 - r0);
    let dc = Math.abs(c1 - c0);
    const sr = r0 < r1 ? 1 : -1;
    const sc = c0 < c1 ? 1 : -1;
    let err = dc - dr;
    let r = r0, c = c0;
    while (true) {
      cells.push([r, c]);
      if (r === r1 && c === c1) break;
      const e2 = 2 * err;
      if (e2 > -dr) { err -= dr; c += sc; }
      if (e2 < dc) { err += dc; r += sr; }
    }
    return cells;
  }

  private static rectangleCells(r0: number, c0: number, r1: number, c1: number): [number, number][] {
    const cells: [number, number][] = [];
    const minR = Math.min(r0, r1), maxR = Math.max(r0, r1);
    const minC = Math.min(c0, c1), maxC = Math.max(c0, c1);
    for (let c = minC; c <= maxC; c++) {
      cells.push([minR, c]);
      cells.push([maxR, c]);
    }
    for (let r = minR + 1; r < maxR; r++) {
      cells.push([r, minC]);
      cells.push([r, maxC]);
    }
    return cells;
  }

  private static circleCells(r0: number, c0: number, r1: number, c1: number): [number, number][] {
    const cells: [number, number][] = [];
    const dr = r1 - r0;
    const dc = c1 - c0;
    const radius = Math.round(Math.sqrt(dr * dr + dc * dc));
    if (radius === 0) { cells.push([r0, c0]); return cells; }

    // Midpoint circle algorithm
    let x = radius, y = 0;
    let err = 1 - radius;
    while (x >= y) {
      cells.push([r0 + y, c0 + x]);
      cells.push([r0 + x, c0 + y]);
      cells.push([r0 + x, c0 - y]);
      cells.push([r0 + y, c0 - x]);
      cells.push([r0 - y, c0 - x]);
      cells.push([r0 - x, c0 - y]);
      cells.push([r0 - x, c0 + y]);
      cells.push([r0 - y, c0 + x]);
      y++;
      if (err < 0) {
        err += 2 * y + 1;
      } else {
        x--;
        err += 2 * (y - x) + 1;
      }
    }
    return cells;
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

  /** Re-render the pattern preview at the current position (e.g. after rotation change). */
  refreshPatternPreview(): void {
    if (!this.tools.selectedPattern || !this.previewPosition) return;
    const rotated = this.onGetRotatedPattern(this.tools.selectedPattern, this.tools.patternRotation);
    this.renderer.setPatternPreview({ pattern: rotated, row: this.previewPosition.row, col: this.previewPosition.col });
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
