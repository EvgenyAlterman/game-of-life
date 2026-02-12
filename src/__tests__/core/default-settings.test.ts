import { describe, it, expect } from 'vitest';
import {
  DEFAULT_GRID_SETTINGS,
  DEFAULT_VISUAL_SETTINGS,
  DEFAULT_AUTO_STOP,
  DEFAULT_CUSTOM_RULES,
  DEFAULT_DRAWING_TOOLS,
  DEFAULT_SIMULATION,
  DEFAULT_SLIDER_MAXES,
  getDefaultSettings,
} from '../../core/default-settings';

describe('default-settings', () => {
  describe('DEFAULT_GRID_SETTINGS', () => {
    it('has valid grid dimensions', () => {
      expect(DEFAULT_GRID_SETTINGS.rows).toBeGreaterThan(0);
      expect(DEFAULT_GRID_SETTINGS.cols).toBeGreaterThan(0);
      expect(DEFAULT_GRID_SETTINGS.cellSize).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_VISUAL_SETTINGS', () => {
    it('has valid visual settings', () => {
      expect(typeof DEFAULT_VISUAL_SETTINGS.showGrid).toBe('boolean');
      expect(typeof DEFAULT_VISUAL_SETTINGS.showPixelGrid).toBe('boolean');
      expect(typeof DEFAULT_VISUAL_SETTINGS.showFade).toBe('boolean');
      expect(typeof DEFAULT_VISUAL_SETTINGS.showMaturity).toBe('boolean');
      expect(DEFAULT_VISUAL_SETTINGS.fadeDuration).toBeGreaterThan(0);
      expect(DEFAULT_VISUAL_SETTINGS.maturityColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(['square', 'circle']).toContain(DEFAULT_VISUAL_SETTINGS.cellShape);
    });
  });

  describe('DEFAULT_AUTO_STOP', () => {
    it('has valid auto-stop settings', () => {
      expect(typeof DEFAULT_AUTO_STOP.enabled).toBe('boolean');
      expect(DEFAULT_AUTO_STOP.delaySetting).toBeGreaterThan(0);
      expect(typeof DEFAULT_AUTO_STOP.showNotification).toBe('boolean');
    });
  });

  describe('DEFAULT_CUSTOM_RULES', () => {
    it('has Conway rules as default', () => {
      expect(DEFAULT_CUSTOM_RULES.ruleString).toBe('B3/S23');
    });
  });

  describe('DEFAULT_DRAWING_TOOLS', () => {
    it('has cell mode as default', () => {
      expect(DEFAULT_DRAWING_TOOLS.mode).toBe('cell');
      expect(DEFAULT_DRAWING_TOOLS.selectedPattern).toBeNull();
      expect(DEFAULT_DRAWING_TOOLS.rotation).toBe(0);
    });
  });

  describe('DEFAULT_SIMULATION', () => {
    it('has valid simulation settings', () => {
      expect(DEFAULT_SIMULATION.speed).toBeGreaterThan(0);
      expect(DEFAULT_SIMULATION.randomDensity).toBeGreaterThan(0);
      expect(DEFAULT_SIMULATION.randomDensity).toBeLessThanOrEqual(100);
    });
  });

  describe('DEFAULT_SLIDER_MAXES', () => {
    it('has string values for all maxes', () => {
      expect(typeof DEFAULT_SLIDER_MAXES.speedMax).toBe('string');
      expect(typeof DEFAULT_SLIDER_MAXES.gridWidthMax).toBe('string');
      expect(typeof DEFAULT_SLIDER_MAXES.gridHeightMax).toBe('string');
      expect(typeof DEFAULT_SLIDER_MAXES.cellSizeMax).toBe('string');
      expect(typeof DEFAULT_SLIDER_MAXES.randomDensityMax).toBe('string');
    });

    it('has parseable numeric values', () => {
      expect(parseInt(DEFAULT_SLIDER_MAXES.speedMax)).toBeGreaterThan(0);
      expect(parseInt(DEFAULT_SLIDER_MAXES.gridWidthMax)).toBeGreaterThan(0);
    });
  });

  describe('getDefaultSettings', () => {
    it('returns a complete settings snapshot', () => {
      const settings = getDefaultSettings();

      expect(settings.gridSettings).toEqual(DEFAULT_GRID_SETTINGS);
      expect(settings.visualSettings).toEqual(DEFAULT_VISUAL_SETTINGS);
      expect(settings.autoStop).toEqual(DEFAULT_AUTO_STOP);
      expect(settings.customRules).toEqual(DEFAULT_CUSTOM_RULES);
      expect(settings.drawingTools).toEqual(DEFAULT_DRAWING_TOOLS);
      expect(settings.speed).toBe(DEFAULT_SIMULATION.speed);
      expect(settings.randomDensity).toBe(DEFAULT_SIMULATION.randomDensity);
      expect(settings.sliderMaxes).toEqual(DEFAULT_SLIDER_MAXES);
      expect(settings.sidebarCollapsed).toBe(false);
      expect(settings.activeTab).toBe('tab-tools');
    });

    it('returns fresh copies each call', () => {
      const settings1 = getDefaultSettings();
      const settings2 = getDefaultSettings();

      expect(settings1).not.toBe(settings2);
      expect(settings1.gridSettings).not.toBe(settings2.gridSettings);
      expect(settings1.visualSettings).not.toBe(settings2.visualSettings);
    });
  });
});
