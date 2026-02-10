import { describe, it, expect, beforeEach } from 'vitest';
import { SidebarManager } from '../../modules/sidebar';
import { EventBus } from '../../core/event-bus';
import { StorageService } from '../../core/storage-service';
import { DomRegistry } from '../../core/dom-registry';

describe('SidebarManager', () => {
  let sidebar: SidebarManager;
  let bus: EventBus;
  let storage: StorageService;
  let dom: DomRegistry;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="sidebar"></div>
      <div id="sidebarOverlay"></div>
    `;
    localStorage.clear();
    bus = new EventBus();
    storage = new StorageService();
    dom = new DomRegistry();
    sidebar = new SidebarManager(bus, storage, dom);
  });

  describe('toggle', () => {
    it('adds collapsed class when toggling', () => {
      sidebar.toggle();
      expect(document.querySelector('.sidebar')!.classList.contains('collapsed')).toBe(true);
    });

    it('removes collapsed class on second toggle', () => {
      sidebar.toggle();
      sidebar.toggle();
      expect(document.querySelector('.sidebar')!.classList.contains('collapsed')).toBe(false);
    });
  });

  describe('openMobile', () => {
    it('adds open class to sidebar', () => {
      sidebar.openMobile();
      expect(document.querySelector('.sidebar')!.classList.contains('open')).toBe(true);
    });

    it('adds active class to overlay', () => {
      sidebar.openMobile();
      expect(document.getElementById('sidebarOverlay')!.classList.contains('active')).toBe(true);
    });

    it('sets body overflow to hidden', () => {
      sidebar.openMobile();
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('closeMobile', () => {
    it('removes open class from sidebar', () => {
      sidebar.openMobile();
      sidebar.closeMobile();
      expect(document.querySelector('.sidebar')!.classList.contains('open')).toBe(false);
    });

    it('removes active class from overlay', () => {
      sidebar.openMobile();
      sidebar.closeMobile();
      expect(document.getElementById('sidebarOverlay')!.classList.contains('active')).toBe(false);
    });

    it('restores body overflow', () => {
      sidebar.openMobile();
      sidebar.closeMobile();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('setupCollapsibleSections', () => {
    it('restores saved collapsed state', () => {
      document.body.innerHTML = `
        <div class="sidebar"></div>
        <div id="sidebarOverlay"></div>
        <div class="tool-section">
          <div class="section-header" data-toggle="tools">Tools</div>
        </div>
        <div class="tool-section">
          <div class="section-header" data-toggle="visual">Visual</div>
        </div>
      `;
      dom.invalidate();
      storage.saveCollapsibleState({ tools: true, visual: false });

      sidebar.setupCollapsibleSections();

      const toolsSection = document.querySelector('[data-toggle="tools"]')!.closest('.tool-section');
      const visualSection = document.querySelector('[data-toggle="visual"]')!.closest('.tool-section');
      expect(toolsSection!.classList.contains('collapsed')).toBe(true);
      expect(visualSection!.classList.contains('collapsed')).toBe(false);
    });
  });
});
