import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeManager } from '../../modules/theme';
import { EventBus } from '../../core/event-bus';
import { StorageService } from '../../core/storage-service';
import { DomRegistry } from '../../core/dom-registry';

describe('ThemeManager', () => {
  let theme: ThemeManager;
  let bus: EventBus;
  let storage: StorageService;
  let dom: DomRegistry;

  beforeEach(() => {
    document.body.innerHTML = '<input id="darkModeToggle"><span class="toggle-icon" data-lucide="moon"></span></input>';
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
    bus = new EventBus();
    storage = new StorageService();
    dom = new DomRegistry();
    theme = new ThemeManager(bus, storage, dom);
  });

  describe('initialize', () => {
    it('sets dark mode from saved theme', () => {
      storage.setTheme('dark');
      theme.initialize();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('sets light mode from saved theme', () => {
      storage.setTheme('light');
      theme.initialize();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('falls back to light when no saved theme and no system preference', () => {
      // matchMedia defaults to false in happy-dom
      theme.initialize();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('toggle', () => {
    it('toggles from light to dark', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      theme.toggle();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('toggles from dark to light', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      theme.toggle();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('persists theme change', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      theme.toggle();
      expect(storage.getTheme()).toBe('dark');
    });

    it('emits ui:themeChanged event', () => {
      const handler = vi.fn();
      bus.on('ui:themeChanged', handler);
      document.documentElement.setAttribute('data-theme', 'light');
      theme.toggle();
      expect(handler).toHaveBeenCalledWith({ theme: 'dark' });
    });

    it('emits canvas:needsRedraw', () => {
      const handler = vi.fn();
      bus.on('canvas:needsRedraw', handler);
      document.documentElement.setAttribute('data-theme', 'light');
      theme.toggle();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('isDark', () => {
    it('returns true when theme is dark', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      expect(theme.isDark()).toBe(true);
    });

    it('returns false when theme is light', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      expect(theme.isDark()).toBe(false);
    });
  });
});
