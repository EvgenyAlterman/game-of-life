/**
 * Reusable modal utility for notifications and confirmations.
 * Replaces browser alert() and confirm() dialogs with styled modals.
 */

export type ModalType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

export interface ModalOptions {
  type: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

class ModalService {
  private overlay: HTMLElement | null = null;
  private resolvePromise: ((value: boolean) => void) | null = null;
  private boundHandleKeydown: (e: KeyboardEvent) => void;

  constructor() {
    this.boundHandleKeydown = this.handleKeydown.bind(this);
  }

  private ensureModal(): HTMLElement {
    if (this.overlay) return this.overlay;

    this.overlay = document.getElementById('notificationModal');
    if (!this.overlay) {
      throw new Error('Notification modal element not found in DOM');
    }

    this.setupListeners();
    return this.overlay;
  }

  private setupListeners(): void {
    if (!this.overlay) return;

    const closeBtn = this.overlay.querySelector('#notificationModalClose');
    const cancelBtn = this.overlay.querySelector('#modalCancelBtn');
    const confirmBtn = this.overlay.querySelector('#modalConfirmBtn');

    closeBtn?.addEventListener('click', () => this.close(false));
    cancelBtn?.addEventListener('click', () => this.close(false));
    confirmBtn?.addEventListener('click', () => this.close(true));

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close(false);
    });
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.close(true);
    }
  }

  private close(result: boolean): void {
    if (!this.overlay) return;

    this.overlay.style.display = 'none';
    document.removeEventListener('keydown', this.boundHandleKeydown);

    if (this.resolvePromise) {
      this.resolvePromise(result);
      this.resolvePromise = null;
    }
  }

  show(options: ModalOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const overlay = this.ensureModal();
      this.resolvePromise = resolve;

      const titleEl = overlay.querySelector('#modalTitle');
      const messageEl = overlay.querySelector('#modalMessage');
      const cancelBtn = overlay.querySelector('#modalCancelBtn') as HTMLElement;
      const confirmBtn = overlay.querySelector('#modalConfirmBtn') as HTMLElement;
      const modal = overlay.querySelector('.modal');

      if (titleEl) titleEl.textContent = options.title;
      if (messageEl) messageEl.textContent = options.message;

      if (confirmBtn) {
        confirmBtn.textContent = options.confirmText || 'OK';
      }

      // Show/hide cancel button based on modal type
      if (cancelBtn) {
        if (options.type === 'confirm') {
          cancelBtn.style.display = 'block';
          cancelBtn.textContent = options.cancelText || 'Cancel';
        } else {
          cancelBtn.style.display = 'none';
        }
      }

      // Apply type-specific styling
      if (modal) {
        modal.classList.remove('modal--info', 'modal--success', 'modal--warning', 'modal--error', 'modal--confirm');
        modal.classList.add(`modal--${options.type}`);
      }

      // Style confirm button based on type
      if (confirmBtn) {
        confirmBtn.classList.remove('save-btn--danger');
        if (options.type === 'error' || (options.type === 'confirm' && options.confirmText?.toLowerCase() === 'delete')) {
          confirmBtn.classList.add('save-btn--danger');
        }
      }

      overlay.style.display = 'flex';
      document.addEventListener('keydown', this.boundHandleKeydown);

      // Focus the confirm button
      confirmBtn?.focus();

      // Refresh icons if lucide is available
      if (typeof window !== 'undefined' && (window as any).lucide) {
        try { (window as any).lucide.createIcons(); } catch { /* ignore */ }
      }
    });
  }

  // Convenience methods
  info(title: string, message: string): Promise<boolean> {
    return this.show({ type: 'info', title, message });
  }

  success(title: string, message: string): Promise<boolean> {
    return this.show({ type: 'success', title, message });
  }

  warning(title: string, message: string): Promise<boolean> {
    return this.show({ type: 'warning', title, message });
  }

  error(title: string, message: string): Promise<boolean> {
    return this.show({ type: 'error', title, message });
  }

  confirm(title: string, message: string, confirmText = 'OK', cancelText = 'Cancel'): Promise<boolean> {
    return this.show({ type: 'confirm', title, message, confirmText, cancelText });
  }
}

// Export singleton instance
export const Modal = new ModalService();
