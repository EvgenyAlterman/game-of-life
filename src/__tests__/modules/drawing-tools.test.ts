import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DrawingToolsManager } from '../../modules/drawing-tools';
import { EventBus } from '../../core/event-bus';
import { DomRegistry } from '../../core/dom-registry';

function setupDOM() {
  document.body.innerHTML = `
    <button id="cellDrawingBtn" class="tool-btn"></button>
    <button id="cellInspectorBtn" class="tool-btn"></button>
    <button id="patternSelectBtn" class="tool-btn"></button>
    <button id="eraserBtn" class="tool-btn"></button>
    <div id="eraserSettings" style="display:none"></div>
    <canvas id="gameCanvas"></canvas>
    <div class="info"></div>
  `;
}

describe('DrawingToolsManager', () => {
  let tools: DrawingToolsManager;
  let bus: EventBus;
  let dom: DomRegistry;

  beforeEach(() => {
    setupDOM();
    bus = new EventBus();
    dom = new DomRegistry();
    tools = new DrawingToolsManager(bus, dom);
  });

  describe('selectCellMode', () => {
    it('sets mode to cell', () => {
      tools.selectCellMode();
      expect(tools.mode).toBe('cell');
      expect(tools.inspectorMode).toBe(false);
      expect(tools.selectionMode).toBe(false);
      expect(tools.selectedPattern).toBeNull();
    });

    it('emits tool:changed event', () => {
      const handler = vi.fn();
      bus.on('tool:changed', handler);
      tools.selectCellMode();
      expect(handler).toHaveBeenCalledWith({ mode: 'cell' });
    });

    it('highlights cell button in UI', () => {
      tools.selectCellMode();
      expect(document.getElementById('cellDrawingBtn')!.classList.contains('selected')).toBe(true);
    });

    it('hides eraser settings', () => {
      document.getElementById('eraserSettings')!.style.display = 'block';
      tools.selectCellMode();
      expect(document.getElementById('eraserSettings')!.style.display).toBe('none');
    });
  });

  describe('selectInspectorMode', () => {
    it('sets inspector mode', () => {
      tools.selectInspectorMode();
      expect(tools.mode).toBe('inspector');
      expect(tools.inspectorMode).toBe(true);
    });

    it('highlights inspector button', () => {
      tools.selectInspectorMode();
      expect(document.getElementById('cellInspectorBtn')!.classList.contains('selected')).toBe(true);
    });
  });

  describe('selectSelectionMode', () => {
    it('sets selection mode', () => {
      tools.selectSelectionMode();
      expect(tools.mode).toBe('selection');
      expect(tools.selectionMode).toBe(true);
    });
  });

  describe('selectEraserMode', () => {
    it('sets eraser mode', () => {
      tools.selectEraserMode();
      expect(tools.mode).toBe('eraser');
    });

    it('shows eraser settings', () => {
      tools.selectEraserMode();
      expect(document.getElementById('eraserSettings')!.style.display).toBe('block');
    });
  });

  describe('selectPattern', () => {
    it('sets pattern mode with pattern data', () => {
      const pattern = [[0, 1, 0], [0, 0, 1], [1, 1, 1]];
      tools.selectPattern('glider', pattern);
      expect(tools.mode).toBe('glider');
      expect(tools.selectedPattern).toEqual(pattern);
      expect(tools.patternRotation).toBe(0);
    });

    it('emits pattern:selected event', () => {
      const handler = vi.fn();
      bus.on('pattern:selected', handler);
      const pattern = [[1, 1]];
      tools.selectPattern('block', pattern);
      expect(handler).toHaveBeenCalledWith({ name: 'block', pattern });
    });
  });

  describe('selectCustomPattern', () => {
    it('prefixes mode with custom:', () => {
      tools.selectCustomPattern('My Pattern', [[1]]);
      expect(tools.mode).toBe('custom:My Pattern');
    });
  });

  describe('mode switching clears previous state', () => {
    it('selecting cell mode clears pattern', () => {
      tools.selectPattern('glider', [[1]]);
      tools.selectCellMode();
      expect(tools.selectedPattern).toBeNull();
      expect(tools.patternRotation).toBe(0);
    });

    it('selecting pattern mode clears inspector', () => {
      tools.selectInspectorMode();
      tools.selectPattern('block', [[1, 1]]);
      expect(tools.inspectorMode).toBe(false);
    });
  });

  describe('getState', () => {
    it('returns current state snapshot', () => {
      tools.selectPattern('glider', [[0, 1], [1, 1]]);
      tools.patternRotation = 90;
      const state = tools.getState();
      expect(state.mode).toBe('glider');
      expect(state.selectedPattern).toEqual([[0, 1], [1, 1]]);
      expect(state.patternRotation).toBe(90);
    });
  });
});
