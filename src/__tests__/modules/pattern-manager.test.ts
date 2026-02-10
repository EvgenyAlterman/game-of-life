import { describe, it, expect, beforeEach } from 'vitest';
import { PatternManager } from '../../modules/pattern-manager';
import { EventBus } from '../../core/event-bus';
import { StorageService } from '../../core/storage-service';
import { DomRegistry } from '../../core/dom-registry';

describe('PatternManager', () => {
  let pm: PatternManager;
  let bus: EventBus;
  let storage: StorageService;
  let dom: DomRegistry;

  beforeEach(() => {
    document.body.innerHTML = '<div id="patternTree"></div><div id="searchResults"></div><input id="patternSearch" />';
    localStorage.clear();
    bus = new EventBus();
    storage = new StorageService();
    dom = new DomRegistry();
    pm = new PatternManager(bus, storage, dom);
  });

  describe('rotation', () => {
    it('returns same pattern for 0 degrees', () => {
      const pattern = [[1, 0], [0, 1]];
      expect(PatternManager.rotatePattern(pattern, 0)).toEqual(pattern);
    });

    it('rotates 90 degrees clockwise', () => {
      const pattern = [
        [0, 1, 0],
        [0, 0, 1],
        [1, 1, 1],
      ];
      const rotated = PatternManager.rotatePattern(pattern, 90);
      expect(rotated).toEqual([
        [1, 0, 0],
        [1, 0, 1],
        [1, 1, 0],
      ]);
    });

    it('rotates 180 degrees', () => {
      const pattern = [
        [1, 0],
        [0, 1],
      ];
      const rotated = PatternManager.rotatePattern(pattern, 180);
      expect(rotated).toEqual([
        [1, 0],
        [0, 1],
      ]);
    });

    it('rotates 270 degrees (same as -90)', () => {
      const pattern = [
        [0, 1, 0],
        [0, 0, 1],
        [1, 1, 1],
      ];
      const rotated90 = PatternManager.rotatePattern(pattern, 90);
      const rotated270 = PatternManager.rotatePattern(pattern, 270);
      // 3 rotations of 90 = 270
      const rotated3x = PatternManager.rotatePattern(
        PatternManager.rotatePattern(rotated90, 90), 90,
      );
      expect(rotated270).toEqual(rotated3x);
    });

    it('360 degrees returns original', () => {
      const pattern = [[0, 1], [1, 0]];
      expect(PatternManager.rotatePattern(pattern, 360)).toEqual(pattern);
    });

    it('handles single-cell pattern', () => {
      expect(PatternManager.rotatePattern([[1]], 90)).toEqual([[1]]);
    });

    it('handles rectangular (non-square) patterns', () => {
      const pattern = [[1, 1, 1]]; // 1x3
      const rotated = PatternManager.rotatePattern(pattern, 90);
      expect(rotated).toEqual([[1], [1], [1]]); // 3x1
    });
  });

  describe('getPatternIcon', () => {
    it('returns known icon for known pattern', () => {
      expect(PatternManager.getPatternIcon({ key: 'glider', name: 'Glider' })).toBe('✈️');
    });

    it('returns default icon for unknown pattern', () => {
      expect(PatternManager.getPatternIcon({ name: 'unknown' })).toBe('🔹');
    });

    it('prefers key over name', () => {
      expect(PatternManager.getPatternIcon({ key: 'block', name: 'My Block' })).toBe('⬛');
    });
  });

  describe('custom patterns', () => {
    it('saves and retrieves custom pattern', () => {
      pm.saveCustomPattern({ name: 'Test', category: 'custom', pattern: [[1, 0], [0, 1]] });
      const patterns = storage.getCustomPatterns();
      expect(patterns).toHaveLength(1);
      expect(patterns[0].name).toBe('Test');
    });

    it('overwrites existing pattern with same name', () => {
      pm.saveCustomPattern({ name: 'Test', category: 'custom', pattern: [[1]] });
      pm.saveCustomPattern({ name: 'Test', category: 'custom', pattern: [[1, 1]] });
      const patterns = storage.getCustomPatterns();
      expect(patterns).toHaveLength(1);
      expect(patterns[0].pattern).toEqual([[1, 1]]);
    });

    it('deletes custom pattern', () => {
      pm.saveCustomPattern({ name: 'A', category: 'custom', pattern: [[1]] });
      pm.saveCustomPattern({ name: 'B', category: 'custom', pattern: [[0, 1]] });
      pm.deleteCustomPattern('A');
      const patterns = storage.getCustomPatterns();
      expect(patterns).toHaveLength(1);
      expect(patterns[0].name).toBe('B');
    });
  });

  describe('search', () => {
    it('clears search when query is empty', () => {
      pm.handleSearch('', () => []);
      const resultsEl = document.getElementById('searchResults')!;
      expect(resultsEl.style.display).toBe('none');
    });

    it('displays no-results message', () => {
      pm.handleSearch('zzzzz', () => []);
      const resultsEl = document.getElementById('searchResults')!;
      expect(resultsEl.style.display).toBe('block');
      expect(resultsEl.textContent).toContain('No patterns found');
    });

    it('displays search results', () => {
      pm.handleSearch('glider', () => [
        { key: 'glider', name: 'Glider', description: 'A small spaceship' },
      ]);
      const resultsEl = document.getElementById('searchResults')!;
      expect(resultsEl.style.display).toBe('block');
      expect(resultsEl.textContent).toContain('Glider');
    });
  });
});
