/**
 * Dark/light theme management with system preference detection.
 */

import type { EventBus } from '../core/event-bus';
import type { StorageService } from '../core/storage-service';
import type { DomRegistry } from '../core/dom-registry';

declare const lucide: { createIcons: () => void };

export class ThemeManager {
  private bus: EventBus;
  private storage: StorageService;
  private dom: DomRegistry;

  constructor(bus: EventBus, storage: StorageService, dom: DomRegistry) {
    this.bus = bus;
    this.storage = storage;
    this.dom = dom;
  }

  initialize(): void {
    const savedTheme = this.storage.getTheme();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      this.setDarkMode(true);
    } else {
      this.setDarkMode(false);
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.storage.getTheme()) {
        this.setDarkMode(e.matches);
      }
    });
  }

  toggle(): void {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this.setDarkMode(!isDark);
  }

  isDark(): boolean {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  private setDarkMode(isDark: boolean): void {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    this.storage.setTheme(isDark ? 'dark' : 'light');
    this.updateIcon(isDark);
    this.bus.emit('ui:themeChanged', { theme: isDark ? 'dark' : 'light' });
    this.bus.emit('canvas:needsRedraw');
  }

  private updateIcon(isDark: boolean): void {
    const toggle = this.dom.get('darkModeToggle');
    if (!toggle) return;
    const icon = toggle.querySelector('.toggle-icon');
    if (icon) {
      icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}
