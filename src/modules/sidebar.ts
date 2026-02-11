/**
 * Sidebar collapse/expand, tab navigation, and mobile drawer management.
 */

import type { EventBus } from '../core/event-bus';
import type { StorageService } from '../core/storage-service';
import type { DomRegistry } from '../core/dom-registry';

declare const lucide: { createIcons: () => void };

export class SidebarManager {
  private bus: EventBus;
  private storage: StorageService;
  private dom: DomRegistry;

  public activeTab = 'controls';

  constructor(bus: EventBus, storage: StorageService, dom: DomRegistry) {
    this.bus = bus;
    this.storage = storage;
    this.dom = dom;
  }

  toggle(): void {
    const sidebar = this.dom.query<HTMLElement>('.sidebar');
    const toggleBtn = this.dom.get('sidebarToggle');
    if (sidebar) {
      sidebar.classList.toggle('collapsed');
      const isCollapsed = sidebar.classList.contains('collapsed');

      // Update toggle icon
      if (toggleBtn) {
        const icon = toggleBtn.querySelector('i, svg');
        if (icon) {
          icon.setAttribute('data-lucide', isCollapsed ? 'panel-left-open' : 'panel-left-close');
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }
      }

      this.bus.emit('ui:sidebarToggled', { open: !isCollapsed });
    }
  }

  switchTab(tabId: string): void {
    const sidebar = this.dom.query<HTMLElement>('.sidebar');

    // If sidebar is collapsed, expand it first
    if (sidebar?.classList.contains('collapsed')) {
      sidebar.classList.remove('collapsed');
      const toggleBtn = this.dom.get('sidebarToggle');
      if (toggleBtn) {
        const icon = toggleBtn.querySelector('i, svg');
        if (icon) {
          icon.setAttribute('data-lucide', 'panel-left-close');
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }
      }
    }

    // Update nav button active states
    document.querySelectorAll('.sidebar-nav-btn[data-tab]').forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.tab === tabId);
    });

    // Update panel visibility
    document.querySelectorAll('.sidebar-panel').forEach(panel => {
      panel.classList.toggle('active', (panel as HTMLElement).dataset.panel === tabId);
    });

    this.activeTab = tabId;
    this.bus.emit('ui:tabChanged', { tab: tabId });
    this.bus.emit('settings:changed');
  }

  getActiveTab(): string {
    return this.activeTab;
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
    // Update UI without triggering save
    document.querySelectorAll('.sidebar-nav-btn[data-tab]').forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.tab === tabId);
    });
    document.querySelectorAll('.sidebar-panel').forEach(panel => {
      panel.classList.toggle('active', (panel as HTMLElement).dataset.panel === tabId);
    });
  }

  openMobile(): void {
    const sidebar = this.dom.query<HTMLElement>('.sidebar');
    const overlay = this.dom.get('sidebarOverlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeMobile(): void {
    const sidebar = this.dom.query<HTMLElement>('.sidebar');
    const overlay = this.dom.get('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  setupCollapsibleSections(): void {
    document.querySelectorAll('.section-header[data-toggle]').forEach((header) => {
      header.addEventListener('click', () => {
        const sectionType = (header as HTMLElement).dataset.toggle!;
        const section = header.closest('.tool-section');
        if (!section) return;

        section.classList.toggle('collapsed');

        const state = this.storage.getCollapsibleState();
        state[sectionType] = section.classList.contains('collapsed');
        this.storage.saveCollapsibleState(state);
      });
    });

    // Restore saved collapsed states
    const state = this.storage.getCollapsibleState();
    if (state.collapsedSections) {
      // Handle legacy format where state was nested under collapsedSections
      const sections = (state as any).collapsedSections as Record<string, boolean>;
      Object.entries(sections).forEach(([sectionType, isCollapsed]) => {
        if (isCollapsed) {
          const header = document.querySelector(`[data-toggle="${sectionType}"]`);
          if (header) {
            const section = header.closest('.tool-section');
            section?.classList.add('collapsed');
          }
        }
      });
    } else {
      Object.entries(state).forEach(([sectionType, isCollapsed]) => {
        if (isCollapsed) {
          const header = document.querySelector(`[data-toggle="${sectionType}"]`);
          if (header) {
            const section = header.closest('.tool-section');
            section?.classList.add('collapsed');
          }
        }
      });
    }
  }
}
