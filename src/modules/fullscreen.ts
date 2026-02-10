import { EventBus } from '../core/event-bus';
import { DomRegistry } from '../core/dom-registry';

export interface FullscreenEngine {
  resize(rows: number, cols: number): void;
  getGridSnapshot(): { grid: boolean[][]; generation?: number } | null;
  setCell(row: number, col: number, alive: boolean): void;
  generation: number;
}

export class FullscreenManager {
  private bus: EventBus;
  private dom: DomRegistry;
  private engine: FullscreenEngine;
  private canvas: HTMLCanvasElement;

  public isFullscreen = false;
  public originalCanvasSize = { width: 0, height: 0 };
  public cellSize: number;
  public rows: number;
  public cols: number;

  /** Called after canvas resize so host can redraw + updateInfo */
  public onResize: ((rows: number, cols: number, cellSize: number) => void) | null = null;
  public onUpdatePlayPause: (() => void) | null = null;
  public isRunning = false;

  constructor(
    bus: EventBus,
    dom: DomRegistry,
    engine: FullscreenEngine,
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
    this.originalCanvasSize = { width: canvas.width, height: canvas.height };
  }

  enter(): void {
    this.originalCanvasSize = { width: this.canvas.width, height: this.canvas.height };

    document.body.classList.add('fullscreen-active');
    const container = this.dom.query<HTMLElement>('.game-container');
    if (container) container.classList.add('fullscreen');

    const exitBtn = this.dom.get<HTMLElement>('exitFullscreenBtn');
    if (exitBtn) exitBtn.style.display = 'block';

    const controls = this.dom.get<HTMLElement>('fullscreenFloatingControls');
    if (controls) controls.style.display = 'flex';

    this.updatePlayPauseButton();

    const fsBtn = this.dom.get<HTMLElement>('fullscreenBtn');
    if (fsBtn) {
      fsBtn.title = 'Exit Fullscreen';
      const icon = fsBtn.querySelector('.btn-icon');
      if (icon) icon.setAttribute('data-lucide', 'minimize');
    }

    this.isFullscreen = true;
    this.resizeForFullscreen();

    this.bus.emit('ui:fullscreenEnter');
    this.tryCreateIcons();
  }

  exit(): void {
    document.body.classList.remove('fullscreen-active');
    const container = this.dom.query<HTMLElement>('.game-container');
    if (container) container.classList.remove('fullscreen');

    const exitBtn = this.dom.get<HTMLElement>('exitFullscreenBtn');
    if (exitBtn) exitBtn.style.display = 'none';

    const controls = this.dom.get<HTMLElement>('fullscreenFloatingControls');
    if (controls) controls.style.display = 'none';

    const fsBtn = this.dom.get<HTMLElement>('fullscreenBtn');
    if (fsBtn) {
      fsBtn.title = 'Enter Fullscreen';
      const icon = fsBtn.querySelector('.btn-icon');
      if (icon) icon.setAttribute('data-lucide', 'maximize');
    }

    this.isFullscreen = false;

    const snapshot = this.engine.getGridSnapshot();
    this.canvas.width = this.originalCanvasSize.width;
    this.canvas.height = this.originalCanvasSize.height;

    this.rows = Math.floor(this.canvas.height / this.cellSize);
    this.cols = Math.floor(this.canvas.width / this.cellSize);
    this.engine.resize(this.rows, this.cols);

    this.restoreGrid(snapshot, this.rows, this.cols);

    this.bus.emit('ui:fullscreenExit');
    if (this.onResize) this.onResize(this.rows, this.cols, this.cellSize);
    this.tryCreateIcons();
  }

  private resizeForFullscreen(): void {
    const maxW = window.innerWidth - 40;
    const maxH = window.innerHeight - 40;
    const newCols = Math.floor(maxW / this.cellSize);
    const newRows = Math.floor(maxH / this.cellSize);

    if (newCols === this.cols && newRows === this.rows) return;

    const snapshot = this.engine.getGridSnapshot();

    this.canvas.width = newCols * this.cellSize;
    this.canvas.height = newRows * this.cellSize;
    this.cols = newCols;
    this.rows = newRows;
    this.engine.resize(this.rows, this.cols);

    this.restoreGrid(snapshot, newRows, newCols);

    if (this.onResize) this.onResize(this.rows, this.cols, this.cellSize);
  }

  private restoreGrid(
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
        if (old[r]?.[c]) this.engine.setCell(r, c, true);
      }
    }
    if (snapshot.generation !== undefined) {
      this.engine.generation = snapshot.generation;
    }
  }

  handleFullscreenChange(): void {
    const docFullscreen = !!(document as any).fullscreenElement;
    if (!docFullscreen && this.isFullscreen) {
      this.exit();
    }
  }

  updatePlayPauseButton(): void {
    const btn = this.dom.get<HTMLElement>('fullscreenPlayPauseBtn');
    if (!btn) return;

    const icon = btn.querySelector('.btn-icon');
    if (this.isRunning) {
      if (icon) icon.setAttribute('data-lucide', 'pause');
      btn.title = 'Pause Simulation';
      btn.classList.add('active');
    } else {
      if (icon) icon.setAttribute('data-lucide', 'play');
      btn.title = 'Start Simulation';
      btn.classList.remove('active');
    }

    this.tryCreateIcons();
  }

  private tryCreateIcons(): void {
    if (typeof window !== 'undefined' && (window as any).lucide) {
      try { (window as any).lucide.createIcons(); } catch { /* ignore */ }
    }
  }
}
