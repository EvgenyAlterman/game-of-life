import { describe, it, expect, beforeEach } from 'vitest';
import { parseImportedSettings, type ExportedSettings } from '../../modules/settings-export';
import type { SettingsSnapshot } from '../../modules/settings-persistence';

describe('settings-export', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('parseImportedSettings', () => {
    it('parses valid wrapped format with version', () => {
      const exportData: ExportedSettings = {
        version: 1,
        exportedAt: Date.now(),
        settings: {
          gridSettings: { rows: 50, cols: 80, cellSize: 10 },
          speed: 20,
        },
      };

      const result = parseImportedSettings(JSON.stringify(exportData));

      expect(result.success).toBe(true);
      expect(result.settings?.gridSettings).toEqual({ rows: 50, cols: 80, cellSize: 10 });
      expect(result.settings?.speed).toBe(20);
    });

    it('parses raw settings format without wrapper', () => {
      const rawSettings: SettingsSnapshot = {
        gridSettings: { rows: 30, cols: 40, cellSize: 15 },
        visualSettings: { showGrid: true },
      };

      const result = parseImportedSettings(JSON.stringify(rawSettings));

      expect(result.success).toBe(true);
      expect(result.settings?.gridSettings).toEqual({ rows: 30, cols: 40, cellSize: 15 });
    });

    it('returns error for invalid JSON', () => {
      const result = parseImportedSettings('not valid json {{{');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to parse JSON');
    });

    it('returns error for empty object', () => {
      const result = parseImportedSettings('{}');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid settings format');
    });

    it('returns error for null', () => {
      const result = parseImportedSettings('null');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JSON structure');
    });

    it('returns error for array', () => {
      const result = parseImportedSettings('[1, 2, 3]');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid settings format');
    });

    it('accepts settings with only speed property', () => {
      const result = parseImportedSettings('{"speed": 30}');

      expect(result.success).toBe(true);
      expect(result.settings?.speed).toBe(30);
    });

    it('accepts settings with only customRules property', () => {
      const result = parseImportedSettings('{"customRules": {"ruleString": "B36/S23"}}');

      expect(result.success).toBe(true);
      expect(result.settings?.customRules?.ruleString).toBe('B36/S23');
    });

    it('accepts settings with only gridSettings property', () => {
      const result = parseImportedSettings('{"gridSettings": {"rows": 100}}');

      expect(result.success).toBe(true);
      expect(result.settings?.gridSettings?.rows).toBe(100);
    });

    it('accepts settings with only visualSettings property', () => {
      const result = parseImportedSettings('{"visualSettings": {"showGrid": false}}');

      expect(result.success).toBe(true);
      expect(result.settings?.visualSettings?.showGrid).toBe(false);
    });

    it('handles primitive values in JSON', () => {
      const result = parseImportedSettings('"string"');

      expect(result.success).toBe(false);
      // Primitive strings are not objects, so we get 'Invalid JSON structure'
      expect(result.error).toBe('Invalid JSON structure');
    });

    it('handles numeric JSON', () => {
      const result = parseImportedSettings('123');

      expect(result.success).toBe(false);
      // Numbers are not objects, so we get 'Invalid JSON structure'
      expect(result.error).toBe('Invalid JSON structure');
    });
  });
});
