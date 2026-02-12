/**
 * Sole owner of all canvas draw operations.
 * Other modules set state; this module reads it during draw().
 */

import type { EventBus } from '../core/event-bus';
import type { GameOfLifeEngine } from '../js/game-engine';
import type { CanvasRenderingContext2DWithReset, SelectionBounds, PatternPreviewData } from '../types/game-types';

export interface VisualFlags {
  showGrid: boolean;
  showPixelGrid: boolean;
  fadeMode: boolean;
  maturityMode: boolean;
  cellShape: string;
  fadeDuration: number;
  maturityEndColor: string;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2DWithReset;
  private engine: GameOfLifeEngine;
  private bus: EventBus;

  // Grid dimensions
  rows: number;
  cols: number;
  cellSize: number;

  // Visual flags
  private visual: VisualFlags = {
    showGrid: false,
    showPixelGrid: false,
    fadeMode: false,
    maturityMode: false,
    cellShape: 'rectangle',
    fadeDuration: 1,
    maturityEndColor: '#4c1d95',
  };

  // Pattern preview state (set externally by InputHandler)
  private patternPreview: PatternPreviewData | null = null;

  // Selection state (set externally by SelectionManager)
  private selectionBounds: SelectionBounds | null = null;
  private selectionActive = false;

  constructor(
    canvas: HTMLCanvasElement,
    engine: GameOfLifeEngine,
    bus: EventBus,
    rows: number,
    cols: number,
    cellSize: number,
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx as CanvasRenderingContext2DWithReset;
    this.engine = engine;
    this.bus = bus;
    this.rows = rows;
    this.cols = cols;
    this.cellSize = cellSize;

    this.bus.on('canvas:needsRedraw', () => this.draw());
  }

  // ─── Public API ──────────────────────────────────────────

  draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const rootStyles = getComputedStyle(document.documentElement);
    const cellColor = rootStyles.getPropertyValue('--canvas-cell').trim();

    this.ctx.fillStyle = cellColor;
    this.drawCells();

    if (this.visual.fadeMode) {
      this.drawFadingCells(cellColor);
    }
    if (this.visual.maturityMode) {
      this.drawMatureCells();
    }
    if (this.visual.showPixelGrid) {
      this.drawPixelGrid();
    }
    if (this.visual.showGrid) {
      this.drawGridOverlay();
    }

    this.drawPatternPreview();
    this.drawSelection();
  }

  resize(rows: number, cols: number, cellSize: number): void {
    this.rows = rows;
    this.cols = cols;
    this.cellSize = cellSize;
    this.canvas.width = cols * cellSize;
    this.canvas.height = rows * cellSize;
  }

  setVisualFlags(flags: Partial<VisualFlags>): void {
    Object.assign(this.visual, flags);
  }

  getVisualFlags(): VisualFlags {
    return { ...this.visual };
  }

  setPatternPreview(preview: PatternPreviewData | null): void {
    this.patternPreview = preview;
  }

  setSelection(bounds: SelectionBounds | null, active: boolean): void {
    this.selectionBounds = bounds;
    this.selectionActive = active;
  }

  getCellFromPixel(x: number, y: number): { row: number; col: number } {
    return {
      row: Math.floor(y / this.cellSize),
      col: Math.floor(x / this.cellSize),
    };
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2DWithReset {
    return this.ctx;
  }

  // ─── Pattern preview in modal (standalone canvas) ────────

  drawPatternPreviewInModal(
    previewCanvas: HTMLCanvasElement,
    pattern: number[][],
  ): void {
    const ctx = previewCanvas.getContext('2d');
    if (!ctx || !pattern.length) return;

    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    const maxSize = Math.min(
      previewCanvas.width / pattern[0].length,
      previewCanvas.height / pattern.length,
    );
    const cs = Math.max(2, Math.floor(maxSize));
    const offsetX = (previewCanvas.width - pattern[0].length * cs) / 2;
    const offsetY = (previewCanvas.height - pattern.length * cs) / 2;

    ctx.fillStyle = '#4a90e2';
    for (let r = 0; r < pattern.length; r++) {
      for (let c = 0; c < pattern[r].length; c++) {
        if (pattern[r][c]) {
          ctx.fillRect(offsetX + c * cs, offsetY + r * cs, cs - 1, cs - 1);
        }
      }
    }
  }

  // ─── Color utilities (static, no this-dependent state) ───

  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  static hexToRgba(hex: string, alpha: number): string {
    if (hex.includes('rgb')) {
      return hex.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
    }
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgba(66, 153, 225, ${alpha})`;
  }

  // ─── Private draw helpers ────────────────────────────────

  private drawCells(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.engine.getCell(row, col)) {
          this.drawSingleCell(row, col);
        }
      }
    }
  }

  private drawSingleCell(row: number, col: number): void {
    const centerX = col * this.cellSize + this.cellSize / 2;
    const centerY = row * this.cellSize + this.cellSize / 2;
    const size = this.cellSize - 2;

    switch (this.visual.cellShape) {
      case 'rectangle':
        this.ctx.fillRect(col * this.cellSize + 1, row * this.cellSize + 1, size, size);
        break;
      case 'circle': {
        const radius = size / 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        break;
      }
      case 'triangle': {
        const ts = size * 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - ts / 2);
        this.ctx.lineTo(centerX - ts / 2, centerY + ts / 4);
        this.ctx.lineTo(centerX + ts / 2, centerY + ts / 4);
        this.ctx.closePath();
        this.ctx.fill();
        break;
      }
      case 'diamond': {
        const ds = size * 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - ds / 2);
        this.ctx.lineTo(centerX + ds / 2, centerY);
        this.ctx.lineTo(centerX, centerY + ds / 2);
        this.ctx.lineTo(centerX - ds / 2, centerY);
        this.ctx.closePath();
        this.ctx.fill();
        break;
      }
      case 'pentagon':
        this.drawRegularPolygon(centerX, centerY, size * 0.4, 5);
        break;
      case 'hexagon':
        this.drawRegularPolygon(centerX, centerY, size * 0.4, 6);
        break;
      case 'star':
        this.drawStar(centerX, centerY, size * 0.4, 6);
        break;
      default:
        this.ctx.fillRect(col * this.cellSize + 1, row * this.cellSize + 1, size, size);
    }
  }

  private drawRegularPolygon(cx: number, cy: number, radius: number, sides: number): void {
    this.ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * 2 * Math.PI - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawStar(cx: number, cy: number, radius: number, points: number): void {
    const innerRadius = radius * 0.5;
    this.ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * 2 * Math.PI - Math.PI / 2;
      const r = i % 2 === 0 ? radius : innerRadius;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawFadingCells(baseCellColor: string): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const fadeLevel = this.engine.getCellFadeLevel(row, col);
        const isAlive = this.engine.getCell(row, col);
        if (fadeLevel > 0 && !isAlive) {
          // Scale opacity based on fade level
          // Use min(fadeLevel, 10) / 10 to cap at reasonable max for visual consistency
          // This ensures cells always start visible and fade out smoothly
          const normalizedFade = Math.min(fadeLevel, 10) / 10;
          const opacity = normalizedFade * 0.8;
          this.ctx.fillStyle = CanvasRenderer.hexToRgba(baseCellColor, opacity);
          this.drawSingleCell(row, col);
        }
      }
    }
  }

  private drawMatureCells(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const maturity = this.engine.getCellMaturity(row, col);
        const isAlive = this.engine.getCell(row, col);
        if (maturity > 0 && isAlive) {
          const ratio = Math.min(maturity / 10, 1);
          this.ctx.fillStyle = this.interpolateMaturityColor(ratio);
          this.drawSingleCell(row, col);
        }
      }
    }
  }

  private interpolateMaturityColor(ratio: number): string {
    const rootStyles = getComputedStyle(document.documentElement);
    const baseCellColor = rootStyles.getPropertyValue('--canvas-cell').trim();
    const baseRgb = CanvasRenderer.hexToRgb(baseCellColor);
    const matureRgb = CanvasRenderer.hexToRgb(this.visual.maturityEndColor);
    if (!baseRgb || !matureRgb) return this.visual.maturityEndColor;
    const r = Math.round(baseRgb.r + (matureRgb.r - baseRgb.r) * ratio);
    const g = Math.round(baseRgb.g + (matureRgb.g - baseRgb.g) * ratio);
    const b = Math.round(baseRgb.b + (matureRgb.b - baseRgb.b) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private drawPixelGrid(): void {
    const rootStyles = getComputedStyle(document.documentElement);
    const gridColor = rootStyles.getPropertyValue('--canvas-grid').trim();

    let pixelGridColor: string;
    if (this.visual.showGrid) {
      pixelGridColor = gridColor.includes('#')
        ? CanvasRenderer.hexToRgba(gridColor, 0.3)
        : gridColor.includes('rgb')
          ? gridColor.replace(/rgba?\(([^)]*)\)/, (_m, v) => {
              const p = v.split(',').map((s: string) => s.trim());
              return `rgba(${p[0]}, ${p[1]}, ${p[2]}, 0.3)`;
            })
          : 'rgba(128, 128, 128, 0.3)';
      this.ctx.lineWidth = 0.5;
    } else {
      pixelGridColor = gridColor;
      this.ctx.lineWidth = 1;
    }

    this.ctx.strokeStyle = pixelGridColor;
    for (let col = 0; col <= this.cols; col++) {
      this.ctx.beginPath();
      this.ctx.moveTo(col * this.cellSize, 0);
      this.ctx.lineTo(col * this.cellSize, this.canvas.height);
      this.ctx.stroke();
    }
    for (let row = 0; row <= this.rows; row++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, row * this.cellSize);
      this.ctx.lineTo(this.canvas.width, row * this.cellSize);
      this.ctx.stroke();
    }
  }

  private drawGridOverlay(): void {
    const rootStyles = getComputedStyle(document.documentElement);
    const gridColor = rootStyles.getPropertyValue('--canvas-grid').trim();

    let overlayColor: string;
    if (gridColor.includes('#')) {
      overlayColor = CanvasRenderer.hexToRgba(gridColor, 0.6);
    } else if (gridColor.includes('rgb')) {
      overlayColor = gridColor.replace(/rgba?\(([^)]*)\)/, (_m, v) => {
        const p = v.split(',').map((s: string) => s.trim());
        return `rgba(${p[0]}, ${p[1]}, ${p[2]}, 0.6)`;
      });
    } else {
      overlayColor = 'rgba(128, 128, 128, 0.6)';
    }

    this.ctx.strokeStyle = overlayColor;
    this.ctx.lineWidth = 2;
    for (let col = 0; col <= this.cols; col += 5) {
      this.ctx.beginPath();
      this.ctx.moveTo(col * this.cellSize, 0);
      this.ctx.lineTo(col * this.cellSize, this.canvas.height);
      this.ctx.stroke();
    }
    for (let row = 0; row <= this.rows; row += 5) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, row * this.cellSize);
      this.ctx.lineTo(this.canvas.width, row * this.cellSize);
      this.ctx.stroke();
    }
    this.ctx.lineWidth = 1;
  }

  private drawPatternPreview(): void {
    if (!this.patternPreview) return;
    const { pattern, row: centerRow, col: centerCol } = this.patternPreview;

    const rootStyles = getComputedStyle(document.documentElement);
    const cellColor = rootStyles.getPropertyValue('--canvas-cell').trim();
    this.ctx.fillStyle = CanvasRenderer.hexToRgba(cellColor, 0.3);

    const startRow = centerRow - Math.floor(pattern.length / 2);
    const startCol = centerCol - Math.floor(pattern[0].length / 2);

    for (let i = 0; i < pattern.length; i++) {
      for (let j = 0; j < pattern[i].length; j++) {
        const r = startRow + i;
        const c = startCol + j;
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && pattern[i][j] === 1) {
          this.ctx.fillRect(c * this.cellSize + 1, r * this.cellSize + 1, this.cellSize - 2, this.cellSize - 2);
        }
      }
    }
  }

  private drawSelection(): void {
    if (!this.selectionActive || !this.selectionBounds) return;
    const b = this.selectionBounds;

    this.ctx.strokeStyle = 'rgba(74, 144, 226, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);

    const x = b.startCol * this.cellSize;
    const y = b.startRow * this.cellSize;
    const w = (b.endCol - b.startCol + 1) * this.cellSize;
    const h = (b.endRow - b.startRow + 1) * this.cellSize;

    this.ctx.strokeRect(x, y, w, h);
    this.ctx.fillStyle = 'rgba(74, 144, 226, 0.1)';
    this.ctx.fillRect(x, y, w, h);

    this.ctx.setLineDash([]);
    this.ctx.lineWidth = 1;
  }
}
