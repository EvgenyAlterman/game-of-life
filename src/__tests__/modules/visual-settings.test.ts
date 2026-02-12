import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisualSettingsManager } from '../../modules/visual-settings';
import { EventBus } from '../../core/event-bus';
import { DomRegistry } from '../../core/dom-registry';

function setupDOM() {
  document.body.innerHTML = `
    <button id="gridToggle"><span class="toolbar-label">Grid</span></button>
    <button id="pixelGridToggle"><span class="toolbar-label">Pixels</span></button>
    <button id="fadeToggle"><span class="toolbar-label">Trail</span></button>
    <div id="fadeSettings" style="display:none"></div>
    <button id="maturityToggle"></button>
    <div id="maturitySettings" style="display:none"></div>
    <button id="cellShapeToggle"><i class="toolbar-icon" data-lucide="square"></i><span class="toolbar-label">Square</span></button>
    <span class="color-label">Deep Violet</span>
  `;
}

describe('VisualSettingsManager', () => {
  let vs: VisualSettingsManager;
  let bus: EventBus;
  let dom: DomRegistry;

  beforeEach(() => {
    setupDOM();
    bus = new EventBus();
    dom = new DomRegistry();
    vs = new VisualSettingsManager(bus, dom);
  });

  describe('toggleGrid', () => {
    it('toggles showGrid state', () => {
      expect(vs.showGrid).toBe(false);
      vs.toggleGrid();
      expect(vs.showGrid).toBe(true);
      vs.toggleGrid();
      expect(vs.showGrid).toBe(false);
    });

    it('emits visual:gridToggled event', () => {
      const handler = vi.fn();
      bus.on('visual:gridToggled', handler);
      vs.toggleGrid();
      expect(handler).toHaveBeenCalledWith({ show: true });
    });

    it('emits canvas:needsRedraw', () => {
      const handler = vi.fn();
      bus.on('canvas:needsRedraw', handler);
      vs.toggleGrid();
      expect(handler).toHaveBeenCalled();
    });

    it('emits settings:changed', () => {
      const handler = vi.fn();
      bus.on('settings:changed', handler);
      vs.toggleGrid();
      expect(handler).toHaveBeenCalled();
    });

    it('updates grid UI', () => {
      vs.toggleGrid();
      const toggle = document.getElementById('gridToggle')!;
      expect(toggle.classList.contains('active')).toBe(true);
      expect(toggle.querySelector('.toolbar-label')!.textContent).toBe('Grid ON');
    });
  });

  describe('togglePixelGrid', () => {
    it('toggles showPixelGrid state', () => {
      vs.togglePixelGrid();
      expect(vs.showPixelGrid).toBe(true);
    });

    it('updates pixel grid UI', () => {
      vs.togglePixelGrid();
      const toggle = document.getElementById('pixelGridToggle')!;
      expect(toggle.classList.contains('active')).toBe(true);
      expect(toggle.querySelector('.toolbar-label')!.textContent).toBe('Pixels ON');
    });
  });

  describe('toggleFadeMode', () => {
    const mockEngine = { clearStateTracking: vi.fn() };

    it('toggles fadeMode state', () => {
      vs.toggleFadeMode(mockEngine);
      expect(vs.fadeMode).toBe(true);
    });

    it('calls clearStateTracking when disabling', () => {
      vs.fadeMode = true;
      vs.toggleFadeMode(mockEngine);
      expect(mockEngine.clearStateTracking).toHaveBeenCalled();
    });

    it('shows fade settings when enabled', () => {
      vs.toggleFadeMode(mockEngine);
      expect(document.getElementById('fadeSettings')!.style.display).toBe('block');
    });

    it('hides fade settings when disabled', () => {
      vs.fadeMode = true;
      vs.toggleFadeMode(mockEngine);
      expect(document.getElementById('fadeSettings')!.style.display).toBe('none');
    });
  });

  describe('toggleMaturityMode', () => {
    const mockEngine = { clearStateTracking: vi.fn() };

    it('toggles maturityMode state', () => {
      vs.toggleMaturityMode(mockEngine);
      expect(vs.maturityMode).toBe(true);
    });

    it('shows maturity settings when enabled', () => {
      vs.toggleMaturityMode(mockEngine);
      expect(document.getElementById('maturitySettings')!.style.display).toBe('block');
    });
  });

  describe('toggleCellShape', () => {
    it('cycles through shapes', () => {
      expect(vs.cellShape).toBe('rectangle');
      vs.toggleCellShape();
      expect(vs.cellShape).toBe('circle');
      vs.toggleCellShape();
      expect(vs.cellShape).toBe('triangle');
    });

    it('wraps around to first shape', () => {
      // Set to last shape
      vs.cellShape = 'star';
      vs.toggleCellShape();
      expect(vs.cellShape).toBe('rectangle');
    });

    it('emits visual:cellShapeChanged', () => {
      const handler = vi.fn();
      bus.on('visual:cellShapeChanged', handler);
      vs.toggleCellShape();
      expect(handler).toHaveBeenCalledWith({ shape: 'circle' });
    });
  });

  describe('getState / loadState', () => {
    it('returns current state', () => {
      vs.showGrid = true;
      vs.cellShape = 'hexagon';
      const state = vs.getState();
      expect(state.showGrid).toBe(true);
      expect(state.cellShape).toBe('hexagon');
    });

    it('loads state from saved settings', () => {
      vs.loadState({
        showGrid: true,
        showPixelGrid: true,
        showFade: true,
        cellShape: 'star',
        maturityColor: '#dc2626',
      });
      expect(vs.showGrid).toBe(true);
      expect(vs.showPixelGrid).toBe(true);
      expect(vs.fadeMode).toBe(true);
      expect(vs.cellShape).toBe('star');
      expect(vs.maturityEndColor).toBe('#dc2626');
    });
  });

  describe('getColorName', () => {
    it('returns known color name', () => {
      expect(VisualSettingsManager.getColorName('#4c1d95')).toBe('Deep Violet');
    });

    it('returns Custom for unknown color', () => {
      expect(VisualSettingsManager.getColorName('#123456')).toBe('Custom');
    });

    it('handles uppercase hex', () => {
      expect(VisualSettingsManager.getColorName('#4C1D95')).toBe('Deep Violet');
    });
  });

  describe('setFadeDuration', () => {
    it('sets fadeDuration value', () => {
      vs.setFadeDuration(10);
      expect(vs.fadeDuration).toBe(10);
    });

    it('emits visual:fadeDurationChanged', () => {
      const handler = vi.fn();
      bus.on('visual:fadeDurationChanged', handler);
      vs.setFadeDuration(5);
      expect(handler).toHaveBeenCalledWith({ duration: 5 });
    });

    it('emits canvas:needsRedraw', () => {
      const handler = vi.fn();
      bus.on('canvas:needsRedraw', handler);
      vs.setFadeDuration(5);
      expect(handler).toHaveBeenCalled();
    });

    it('emits settings:changed', () => {
      const handler = vi.fn();
      bus.on('settings:changed', handler);
      vs.setFadeDuration(7);
      expect(handler).toHaveBeenCalled();
    });

    it('includes fadeDuration in getState', () => {
      vs.setFadeDuration(15);
      const state = vs.getState();
      expect(state.fadeDuration).toBe(15);
    });
  });

  describe('fadeDuration persistence', () => {
    it('loads fadeDuration from state', () => {
      vs.loadState({ fadeDuration: 8 });
      expect(vs.fadeDuration).toBe(8);
    });

    it('preserves fadeDuration when loading partial state', () => {
      vs.setFadeDuration(12);
      vs.loadState({ showGrid: true });
      expect(vs.fadeDuration).toBe(12);
    });

    it('defaults fadeDuration to 1', () => {
      expect(vs.fadeDuration).toBe(1);
    });
  });
});
