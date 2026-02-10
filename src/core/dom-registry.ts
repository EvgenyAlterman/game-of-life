/**
 * Centralized DOM element lookup with lazy caching.
 * All getElementById / querySelector calls go through this service.
 */

export class DomRegistry {
  private cache = new Map<string, Element | null>();

  get<T extends Element = HTMLElement>(id: string): T | null {
    if (this.cache.has(id)) {
      return this.cache.get(id) as T | null;
    }
    const el = document.getElementById(id);
    this.cache.set(id, el);
    return el as unknown as T | null;
  }

  require<T extends Element = HTMLElement>(id: string): T {
    const el = this.get<T>(id);
    if (!el) {
      throw new Error(`Required DOM element "#${id}" not found`);
    }
    return el;
  }

  query<T extends Element = HTMLElement>(selector: string): T | null {
    const key = `q:${selector}`;
    if (this.cache.has(key)) {
      return this.cache.get(key) as T | null;
    }
    const el = document.querySelector<T>(selector);
    this.cache.set(key, el);
    return el;
  }

  queryAll<T extends Element = HTMLElement>(selector: string): T[] {
    return Array.from(document.querySelectorAll<T>(selector));
  }

  invalidate(id?: string): void {
    if (id) {
      this.cache.delete(id);
      this.cache.delete(`q:${id}`);
    } else {
      this.cache.clear();
    }
  }
}
