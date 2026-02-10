/**
 * Cell inspector tooltip — shows cell info on hover/click.
 */

import type { GameOfLifeEngine } from '../js/game-engine';

export class InspectorManager {
  private engine: GameOfLifeEngine;
  private tooltip: HTMLElement | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  fadeMode = false;
  maturityMode = false;

  constructor(engine: GameOfLifeEngine) {
    this.engine = engine;
  }

  showCellInfo(row: number, col: number, clientX: number, clientY: number): void {
    const isAlive = this.engine.getCell(row, col);
    const neighbors = this.engine.countNeighbors(row, col);
    const fadeLevel = this.fadeMode ? this.engine.getCellFadeLevel(row, col) : 0;
    const maturity = this.maturityMode ? this.engine.getCellMaturity(row, col) : 0;

    let info = `Cell (${row}, ${col})\n`;
    info += `State: ${isAlive ? 'Alive' : 'Dead'}\n`;
    info += `Neighbors: ${neighbors}`;
    if (fadeLevel > 0) info += `\nFade Level: ${fadeLevel}`;
    if (maturity > 0) info += `\nMaturity: ${maturity}`;

    this.showTooltip(info, clientX, clientY);
  }

  showTooltip(text: string, x: number, y: number): void {
    this.hide();

    const tooltip = document.createElement('div');
    tooltip.className = 'inspector-tooltip';
    tooltip.style.cssText = `
      position: fixed;
      left: ${x + 10}px;
      top: ${y - 10}px;
      background: var(--bg-tooltip);
      color: var(--text-tooltip);
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      white-space: pre-line;
      z-index: 10000;
      pointer-events: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    `;
    tooltip.textContent = text;

    document.body.appendChild(tooltip);
    this.tooltip = tooltip;
    this.hideTimeout = setTimeout(() => this.hide(), 3000);
  }

  hide(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }
}
