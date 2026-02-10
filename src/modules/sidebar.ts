/**
 * Sidebar collapse/expand and mobile drawer management.
 */

import type { EventBus } from '../core/event-bus';
import type { StorageService } from '../core/storage-service';
import type { DomRegistry } from '../core/dom-registry';

export class SidebarManager {
  private bus: EventBus;
  private storage: StorageService;
  private dom: DomRegistry;

  constructor(bus: EventBus, storage: StorageService, dom: DomRegistry) {
    this.bus = bus;
    this.storage = storage;
    this.dom = dom;
  }

  toggle(): void {
    const sidebar = this.dom.query<HTMLElement>('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed');
      this.bus.emit('ui:sidebarToggled', { open: !sidebar.classList.contains('collapsed') });
    }
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
