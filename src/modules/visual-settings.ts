/**
 * Visual settings: grid overlays, fade trails, maturity colors, cell shapes.
 */

import type { EventBus } from '../core/event-bus';
import type { DomRegistry } from '../core/dom-registry';
import type { VisualSettingsState } from '../types/game-types';

declare const lucide: { createIcons: () => void };

const AVAILABLE_SHAPES = ['rectangle', 'circle', 'triangle', 'diamond', 'pentagon', 'hexagon', 'star'];

const COLOR_MAP: Record<string, string> = {
  '#4c1d95': 'Deep Violet',
  '#7c3aed': 'Purple',
  '#8b5cf6': 'Light Purple',
  '#dc2626': 'Red',
  '#ea580c': 'Orange',
  '#ca8a04': 'Yellow',
  '#16a34a': 'Green',
  '#0ea5e9': 'Blue',
  '#e11d48': 'Pink',
  '#9333ea': 'Violet',
  '#000000': 'Black',
  '#ffffff': 'White',
};

export class VisualSettingsManager {
  private bus: EventBus;
  private dom: DomRegistry;

  // State
  showGrid = false;
  showPixelGrid = false;
  fadeMode = false;
  maturityMode = false;
  fadeDuration = 1;
  maturityEndColor = '#4c1d95';
  cellShape = 'rectangle';

  constructor(bus: EventBus, dom: DomRegistry) {
    this.bus = bus;
    this.dom = dom;
  }

  getState(): VisualSettingsState {
    return {
      showGrid: this.showGrid,
      showPixelGrid: this.showPixelGrid,
      showFade: this.fadeMode,
      showMaturity: this.maturityMode,
      fadeDuration: this.fadeDuration,
      maturityColor: this.maturityEndColor,
      cellShape: this.cellShape,
    };
  }

  loadState(state: Partial<VisualSettingsState>): void {
    if (state.showGrid !== undefined) this.showGrid = state.showGrid;
    if (state.showPixelGrid !== undefined) this.showPixelGrid = state.showPixelGrid;
    if (state.showFade !== undefined) this.fadeMode = state.showFade;
    if (state.showMaturity !== undefined) this.maturityMode = state.showMaturity;
    if (state.fadeDuration !== undefined) this.fadeDuration = state.fadeDuration;
    if (state.maturityColor !== undefined) this.maturityEndColor = state.maturityColor;
    if (state.cellShape !== undefined) this.cellShape = state.cellShape;
    this.updateAllUI();
  }

  // ─── Toggle methods ─────────────────────────────────────

  toggleGrid(): void {
    this.showGrid = !this.showGrid;
    this.updateGridUI();
    this.bus.emit('visual:gridToggled', { show: this.showGrid });
    this.bus.emit('canvas:needsRedraw');
    this.bus.emit('settings:changed');
  }

  togglePixelGrid(): void {
    this.showPixelGrid = !this.showPixelGrid;
    this.updatePixelGridUI();
    this.bus.emit('visual:pixelGridToggled', { show: this.showPixelGrid });
    this.bus.emit('canvas:needsRedraw');
    this.bus.emit('settings:changed');
  }

  toggleFadeMode(engine: { clearStateTracking: () => void }): void {
    this.fadeMode = !this.fadeMode;
    this.updateFadeUI();
    if (!this.fadeMode) engine.clearStateTracking();
    this.bus.emit('visual:fadeToggled', { show: this.fadeMode });
    this.bus.emit('canvas:needsRedraw');
    this.bus.emit('settings:changed');
  }

  toggleMaturityMode(engine: { clearStateTracking: () => void }): void {
    this.maturityMode = !this.maturityMode;
    this.updateMaturityUI();
    if (!this.maturityMode) engine.clearStateTracking();
    this.bus.emit('visual:maturityToggled', { show: this.maturityMode });
    this.bus.emit('canvas:needsRedraw');
    this.bus.emit('settings:changed');
  }

  toggleCellShape(): void {
    const idx = AVAILABLE_SHAPES.indexOf(this.cellShape);
    this.cellShape = AVAILABLE_SHAPES[(idx + 1) % AVAILABLE_SHAPES.length];
    this.updateCellShapeUI();
    this.bus.emit('visual:cellShapeChanged', { shape: this.cellShape });
    this.bus.emit('canvas:needsRedraw');
    this.bus.emit('settings:changed');
  }

  setMaturityColor(color: string): void {
    this.maturityEndColor = color;
    this.updateColorLabel();
    this.bus.emit('visual:maturityColorChanged', { color });
    this.bus.emit('canvas:needsRedraw');
    this.bus.emit('settings:changed');
  }

  setFadeDuration(duration: number): void {
    this.fadeDuration = duration;
    this.bus.emit('visual:fadeDurationChanged', { duration });
    this.bus.emit('canvas:needsRedraw');
    this.bus.emit('settings:changed');
  }

  // ─── UI update methods ──────────────────────────────────

  private updateAllUI(): void {
    this.updateGridUI();
    this.updatePixelGridUI();
    this.updateFadeUI();
    this.updateMaturityUI();
    this.updateCellShapeUI();
    this.updateColorLabel();
  }

  private updateGridUI(): void {
    const toggle = this.dom.get('gridToggle');
    if (!toggle) return;
    const text = toggle.querySelector('.toolbar-label');
    if (this.showGrid) {
      toggle.classList.add('active');
      if (text) text.textContent = 'Grid ON';
    } else {
      toggle.classList.remove('active');
      if (text) text.textContent = 'Grid';
    }
  }

  private updatePixelGridUI(): void {
    const toggle = this.dom.get('pixelGridToggle');
    if (!toggle) return;
    const text = toggle.querySelector('.toolbar-label');
    if (this.showPixelGrid) {
      toggle.classList.add('active');
      if (text) text.textContent = 'Pixels ON';
    } else {
      toggle.classList.remove('active');
      if (text) text.textContent = 'Pixels';
    }
  }

  private updateFadeUI(): void {
    const toggle = this.dom.get('fadeToggle');
    const settings = this.dom.get('fadeSettings');
    if (!toggle) return;
    const text = toggle.querySelector('.toolbar-label');
    if (this.fadeMode) {
      toggle.classList.add('active');
      if (text) text.textContent = 'Trail ON';
      if (settings) settings.style.display = 'block';
    } else {
      toggle.classList.remove('active');
      if (text) text.textContent = 'Trail';
      if (settings) settings.style.display = 'none';
    }
  }

  private updateMaturityUI(): void {
    const toggle = this.dom.get('maturityToggle');
    const settings = this.dom.get('maturitySettings');
    if (!toggle) return;
    if (this.maturityMode) {
      toggle.classList.add('active');
      if (settings) settings.style.display = 'block';
    } else {
      toggle.classList.remove('active');
      if (settings) settings.style.display = 'none';
    }
  }

  private updateCellShapeUI(): void {
    const toggle = this.dom.get('cellShapeToggle');
    if (!toggle) return;
    const icon = toggle.querySelector('.toolbar-icon');
    const text = toggle.querySelector('.toolbar-label');

    const shapeConfig: Record<string, { icon: string; text: string }> = {
      rectangle: { icon: 'square', text: 'Square' },
      circle: { icon: 'circle', text: 'Circle' },
      triangle: { icon: 'triangle', text: 'Triangle' },
      diamond: { icon: 'diamond', text: 'Diamond' },
      pentagon: { icon: 'pentagon', text: 'Pentagon' },
      hexagon: { icon: 'hexagon', text: 'Hexagon' },
      star: { icon: 'star', text: 'Star' },
    };

    const config = shapeConfig[this.cellShape] || shapeConfig['rectangle'];
    if (icon) icon.setAttribute('data-lucide', config.icon);
    if (text) text.textContent = config.text;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  private updateColorLabel(): void {
    const label = document.querySelector('.color-label');
    if (label) {
      label.textContent = VisualSettingsManager.getColorName(this.maturityEndColor);
    }
  }

  static getColorName(hex: string): string {
    return COLOR_MAP[hex.toLowerCase()] || 'Custom';
  }
}
