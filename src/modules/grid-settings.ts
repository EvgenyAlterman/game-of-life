import { EventBus } from '../core/event-bus';
import { DomRegistry } from '../core/dom-registry';

export interface GridEngine {
  grid: boolean[][];
  generation: number;
  resize(rows: number, cols: number): void;
  setCell(row: number, col: number, alive: boolean): void;
  getGridSnapshot(): { grid: boolean[][]; generation?: number } | null;
}

export interface GridSettingsState {
  rows: number;
  cols: number;
  cellSize: number;
}

export class GridSettingsManager {
  private bus: EventBus;
  private dom: DomRegistry;
  private engine: GridEngine;
  private canvas: HTMLCanvasElement;

  public rows: number;
  public cols: number;
  public cellSize: number;

  /** Called after resize — host should redraw + updateInfo */
  public onResize: ((rows: number, cols: number, cellSize: number) => void) | null = null;

  constructor(
    bus: EventBus,
    dom: DomRegistry,
    engine: GridEngine,
    canvas: HTMLCanvasElement,
    rows: number,
    cols: number,
    cellSize: number,
  ) {
    this.bus = bus;
    this.dom = dom;
    this.engine = engine;
    this.canvas = canvas;
    this.rows = rows;
    this.cols = cols;
    this.cellSize = cellSize;
  }

  apply(isRunning: boolean): boolean {
    if (isRunning) return false;

    const widthSlider = this.dom.get<HTMLInputElement>('gridWidthSlider');
    const heightSlider = this.dom.get<HTMLInputElement>('gridHeightSlider');
    const sizeSlider = this.dom.get<HTMLInputElement>('cellSizeSlider');
    if (!widthSlider || !heightSlider || !sizeSlider) return false;

    const newCols = parseInt(widthSlider.value, 10);
    const newRows = parseInt(heightSlider.value, 10);
    const newCellSize = parseInt(sizeSlider.value, 10);

    this.canvas.width = newCols * newCellSize;
    this.canvas.height = newRows * newCellSize;
    this.cellSize = newCellSize;
    this.rows = newRows;
    this.cols = newCols;
    this.engine.resize(newRows, newCols);

    this.bus.emit('grid:resized', { rows: newRows, cols: newCols, cellSize: newCellSize });
    this.bus.emit('settings:changed');
    if (this.onResize) this.onResize(newRows, newCols, newCellSize);
    return true;
  }

  liveResize(isFullscreen: boolean): boolean {
    if (isFullscreen) return false;

    const widthSlider = this.dom.get<HTMLInputElement>('gridWidthSlider');
    const heightSlider = this.dom.get<HTMLInputElement>('gridHeightSlider');
    const sizeSlider = this.dom.get<HTMLInputElement>('cellSizeSlider');
    if (!widthSlider || !heightSlider || !sizeSlider) return false;

    const newCols = parseInt(widthSlider.value, 10);
    const newRows = parseInt(heightSlider.value, 10);
    const newCellSize = parseInt(sizeSlider.value, 10);

    if (newCols === this.cols && newRows === this.rows && newCellSize === this.cellSize) {
      return false;
    }

    const snapshot = this.engine.getGridSnapshot();

    this.canvas.width = newCols * newCellSize;
    this.canvas.height = newRows * newCellSize;
    this.cellSize = newCellSize;
    this.rows = newRows;
    this.cols = newCols;
    this.engine.resize(newRows, newCols);

    this.restoreGridContent(snapshot, newRows, newCols);

    this.bus.emit('grid:resized', { rows: newRows, cols: newCols, cellSize: newCellSize });
    if (this.onResize) this.onResize(newRows, newCols, newCellSize);
    return true;
  }

  restoreGridContent(
    snapshot: { grid: boolean[][]; generation?: number } | null,
    newRows: number,
    newCols: number,
  ): void {
    if (!snapshot?.grid) return;

    const old = snapshot.grid;
    const maxR = Math.min(old.length, newRows);
    const maxC = Math.min(old[0]?.length ?? 0, newCols);

    for (let r = 0; r < maxR; r++) {
      for (let c = 0; c < maxC; c++) {
        if (old[r]?.[c] !== undefined) {
          this.engine.setCell(r, c, old[r][c]);
        }
      }
    }

    if (snapshot.generation !== undefined) {
      this.engine.generation = snapshot.generation;
    }
  }

  static updateSliderMax(slider: HTMLInputElement, maxValue: string): void {
    const newMax = parseInt(maxValue, 10);
    const currentValue = parseInt(slider.value, 10);

    if (newMax >= currentValue && newMax > parseInt(slider.min, 10)) {
      slider.max = String(newMax);
    } else if (newMax < currentValue) {
      slider.max = String(newMax);
      slider.value = String(newMax);
      slider.dispatchEvent(new Event('input'));
    }
  }

  getState(): GridSettingsState {
    return { rows: this.rows, cols: this.cols, cellSize: this.cellSize };
  }

  loadState(s: Partial<GridSettingsState>): void {
    if (s.rows !== undefined) this.rows = s.rows;
    if (s.cols !== undefined) this.cols = s.cols;
    if (s.cellSize !== undefined) this.cellSize = s.cellSize;

    // Sync slider DOM elements with loaded values
    const widthSlider = this.dom.get<HTMLInputElement>('gridWidthSlider');
    const heightSlider = this.dom.get<HTMLInputElement>('gridHeightSlider');
    const sizeSlider = this.dom.get<HTMLInputElement>('cellSizeSlider');
    const widthValue = this.dom.get('gridWidthValue');
    const heightValue = this.dom.get('gridHeightValue');
    const sizeValue = this.dom.get('cellSizeValue');

    if (widthSlider && s.cols !== undefined) widthSlider.value = String(s.cols);
    if (heightSlider && s.rows !== undefined) heightSlider.value = String(s.rows);
    if (sizeSlider && s.cellSize !== undefined) sizeSlider.value = String(s.cellSize);
    if (widthValue && s.cols !== undefined) widthValue.textContent = String(s.cols);
    if (heightValue && s.rows !== undefined) heightValue.textContent = String(s.rows);
    if (sizeValue && s.cellSize !== undefined) sizeValue.textContent = s.cellSize + 'px';
  }
}
