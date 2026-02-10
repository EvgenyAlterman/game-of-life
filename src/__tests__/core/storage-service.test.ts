import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StorageService } from '../../core/storage-service';
import type { StoredSettings, CustomPatternData, CollapsibleState } from '../../core/storage-service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    service = new StorageService();
  });

  describe('settings', () => {
    it('returns null when no settings saved', () => {
      expect(service.getSettings()).toBeNull();
    });

    it('round-trips settings', () => {
      const settings: StoredSettings = {
        cellSize: 10,
        rows: 50,
        cols: 80,
        speed: 100,
      };
      service.saveSettings(settings);
      const loaded = service.getSettings();
      expect(loaded).toMatchObject({
        cellSize: 10,
        rows: 50,
        cols: 80,
        speed: 100,
      });
    });

    it('adds timestamp on save', () => {
      service.saveSettings({ cellSize: 10 });
      const loaded = service.getSettings();
      expect(loaded?.timestamp).toBeTypeOf('number');
      expect(loaded!.timestamp).toBeGreaterThan(0);
    });

    it('returns null for expired settings (>30 days)', () => {
      const old: StoredSettings = {
        cellSize: 10,
        timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000,
      };
      localStorage.setItem('gameoflife-settings', JSON.stringify(old));
      expect(service.getSettings()).toBeNull();
    });

    it('returns valid settings within 30 days', () => {
      const recent: StoredSettings = {
        cellSize: 10,
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
      };
      localStorage.setItem('gameoflife-settings', JSON.stringify(recent));
      expect(service.getSettings()).toMatchObject({ cellSize: 10 });
    });

    it('returns null and clears corrupted JSON', () => {
      localStorage.setItem('gameoflife-settings', '{not valid json');
      expect(service.getSettings()).toBeNull();
      expect(localStorage.getItem('gameoflife-settings')).toBeNull();
    });

    it('clearSettings removes settings', () => {
      service.saveSettings({ cellSize: 10 });
      service.clearSettings();
      expect(service.getSettings()).toBeNull();
    });
  });

  describe('theme', () => {
    it('returns null when no theme saved', () => {
      expect(service.getTheme()).toBeNull();
    });

    it('round-trips dark theme', () => {
      service.setTheme('dark');
      expect(service.getTheme()).toBe('dark');
    });

    it('round-trips light theme', () => {
      service.setTheme('light');
      expect(service.getTheme()).toBe('light');
    });

    it('returns null for invalid theme value', () => {
      localStorage.setItem('gameoflife-theme', 'blue');
      expect(service.getTheme()).toBeNull();
    });
  });

  describe('custom patterns', () => {
    it('returns empty array when none saved', () => {
      expect(service.getCustomPatterns()).toEqual([]);
    });

    it('round-trips custom patterns', () => {
      const patterns: CustomPatternData[] = [
        {
          name: 'My Glider',
          category: 'spaceships',
          pattern: [[0, 1, 0], [0, 0, 1], [1, 1, 1]],
        },
      ];
      service.saveCustomPatterns(patterns);
      expect(service.getCustomPatterns()).toEqual(patterns);
    });

    it('returns empty array for corrupted data', () => {
      localStorage.setItem('custom-patterns', 'bad data');
      expect(service.getCustomPatterns()).toEqual([]);
    });
  });

  describe('collapsible state', () => {
    it('returns empty object when none saved', () => {
      expect(service.getCollapsibleState()).toEqual({});
    });

    it('round-trips collapsible state', () => {
      const state: CollapsibleState = {
        'section-tools': true,
        'section-visual': false,
      };
      service.saveCollapsibleState(state);
      expect(service.getCollapsibleState()).toEqual(state);
    });

    it('returns empty object for corrupted data', () => {
      localStorage.setItem('gameOfLifeSettings', '!!!');
      expect(service.getCollapsibleState()).toEqual({});
    });
  });

  describe('clearAll', () => {
    it('removes all managed keys', () => {
      service.saveSettings({ cellSize: 10 });
      service.setTheme('dark');
      service.saveCustomPatterns([{ name: 'X', category: 'c', pattern: [[1]] }]);
      service.saveCollapsibleState({ a: true });

      service.clearAll();

      expect(service.getSettings()).toBeNull();
      expect(service.getTheme()).toBeNull();
      expect(service.getCustomPatterns()).toEqual([]);
      expect(service.getCollapsibleState()).toEqual({});
    });

    it('does not affect unmanaged keys', () => {
      localStorage.setItem('other-app-key', 'value');
      service.clearAll();
      expect(localStorage.getItem('other-app-key')).toBe('value');
    });
  });
});
