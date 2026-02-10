import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SelectionManager } from '../../modules/selection-manager';
import { EventBus } from '../../core/event-bus';
import { DomRegistry } from '../../core/dom-registry';
import { StorageService } from '../../core/storage-service';
import { PatternManager } from '../../modules/pattern-manager';

function createMockEngine(rows = 10, cols = 10) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(false));
  return {
    grid,
    getCell: (r: number, c: number) => grid[r]?.[c] ?? false,
  };
}

function createMockRenderer() {
  return {
    drawPatternPreviewInModal: vi.fn(),
  };
}

function setup() {
  document.body.innerHTML = `
    <span id="patternSize"></span>
    <span id="patternCells"></span>
    <input id="patternName" />
    <select id="patternCategory"><option value="custom">Custom</option></select>
    <canvas id="patternPreviewCanvas" width="100" height="100"></canvas>
    <div id="savePatternModal" style="display:none"></div>
    <div id="patternTree"></div>
    <div id="searchResults"></div>
    <input id="patternSearch" />
  `;
  localStorage.clear();

  const bus = new EventBus();
  const dom = new DomRegistry();
  const storage = new StorageService();
  const engine = createMockEngine();
  const renderer = createMockRenderer();
  const patterns = new PatternManager(bus, storage, dom);
  const sm = new SelectionManager(bus, dom, engine as any, renderer as any, patterns);
  return { sm, engine, renderer, dom, bus, patterns, storage };
}

describe('SelectionManager', () => {
  describe('hasValidSelection', () => {
    it('returns false for null start/end', () => {
      const { sm } = setup();
      expect(sm.hasValidSelection(null, null)).toBe(false);
    });

    it('returns false for same start and end', () => {
      const { sm } = setup();
      expect(sm.hasValidSelection({ row: 3, col: 5 }, { row: 3, col: 5 })).toBe(false);
    });

    it('returns true for different start and end', () => {
      const { sm } = setup();
      expect(sm.hasValidSelection({ row: 1, col: 2 }, { row: 5, col: 8 })).toBe(true);
    });
  });

  describe('getSelectionBounds', () => {
    it('returns null for null inputs', () => {
      const { sm } = setup();
      expect(sm.getSelectionBounds(null, null)).toBeNull();
    });

    it('normalizes bounds regardless of drag direction', () => {
      const { sm } = setup();
      const bounds = sm.getSelectionBounds({ row: 5, col: 8 }, { row: 1, col: 2 });
      expect(bounds).toEqual({
        startRow: 1,
        startCol: 2,
        endRow: 5,
        endCol: 8,
      });
    });

    it('handles same-row horizontal selection', () => {
      const { sm } = setup();
      const bounds = sm.getSelectionBounds({ row: 3, col: 7 }, { row: 3, col: 2 });
      expect(bounds).toEqual({
        startRow: 3,
        startCol: 2,
        endRow: 3,
        endCol: 7,
      });
    });
  });

  describe('extractPattern', () => {
    it('extracts alive cells as 1, dead as 0', () => {
      const { sm, engine } = setup();
      engine.grid[2][3] = true;
      engine.grid[2][4] = true;
      engine.grid[3][3] = true;

      const data = sm.extractPattern({
        startRow: 2, startCol: 3, endRow: 3, endCol: 4,
      });

      expect(data.pattern).toEqual([
        [1, 1],
        [1, 0],
      ]);
      expect(data.width).toBe(2);
      expect(data.height).toBe(2);
      expect(data.activeCells).toBe(3);
    });

    it('handles single-cell extraction', () => {
      const { sm, engine } = setup();
      engine.grid[0][0] = true;

      const data = sm.extractPattern({ startRow: 0, startCol: 0, endRow: 0, endCol: 0 });
      expect(data.pattern).toEqual([[1]]);
      expect(data.activeCells).toBe(1);
    });
  });

  describe('save modal', () => {
    it('shows modal with pattern info', () => {
      const { sm, engine } = setup();
      engine.grid[1][1] = true;
      engine.grid[1][2] = true;

      sm.showSaveModal({ row: 1, col: 1 }, { row: 2, col: 3 });

      expect(document.getElementById('savePatternModal')!.style.display).toBe('block');
      expect(document.getElementById('patternSize')!.textContent).toBe('3×2');
      expect(document.getElementById('patternCells')!.textContent).toBe('2');
    });

    it('closes modal', () => {
      const { sm, engine } = setup();
      engine.grid[1][1] = true;
      sm.showSaveModal({ row: 1, col: 1 }, { row: 2, col: 2 });
      sm.closeSaveModal();
      expect(document.getElementById('savePatternModal')!.style.display).toBe('none');
    });
  });

  describe('saveSelectedPattern', () => {
    it('saves pattern with entered name', () => {
      const { sm, engine, storage } = setup();
      engine.grid[0][0] = true;
      sm.showSaveModal({ row: 0, col: 0 }, { row: 1, col: 1 });

      (document.getElementById('patternName') as HTMLInputElement).value = 'My Block';
      const result = sm.saveSelectedPattern();

      expect(result).toBe(true);
      expect(storage.getCustomPatterns()).toHaveLength(1);
      expect(storage.getCustomPatterns()[0].name).toBe('My Block');
    });

    it('returns false without name', () => {
      const { sm, engine } = setup();
      engine.grid[0][0] = true;
      sm.showSaveModal({ row: 0, col: 0 }, { row: 1, col: 1 });

      (document.getElementById('patternName') as HTMLInputElement).value = '';
      expect(sm.saveSelectedPattern()).toBe(false);
    });
  });
});
