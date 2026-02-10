import { describe, it, expect, beforeEach } from 'vitest';
import { DomRegistry } from '../../core/dom-registry';

describe('DomRegistry', () => {
  let registry: DomRegistry;

  beforeEach(() => {
    document.body.innerHTML = '';
    registry = new DomRegistry();
  });

  describe('get', () => {
    it('returns element by id', () => {
      document.body.innerHTML = '<div id="test">Hello</div>';
      const el = registry.get('test');
      expect(el).toBeInstanceOf(HTMLDivElement);
      expect(el!.textContent).toBe('Hello');
    });

    it('returns null for missing id', () => {
      expect(registry.get('nonexistent')).toBeNull();
    });

    it('caches results', () => {
      document.body.innerHTML = '<div id="test">Hello</div>';
      const first = registry.get('test');
      const second = registry.get('test');
      expect(first).toBe(second);
    });

    it('returns cached null for previously missing element', () => {
      // Element doesn't exist yet
      expect(registry.get('later')).toBeNull();

      // Add the element
      document.body.innerHTML = '<div id="later">Added</div>';

      // Still returns null because it's cached
      expect(registry.get('later')).toBeNull();
    });

    it('returns fresh result after invalidate', () => {
      expect(registry.get('dynamic')).toBeNull();

      document.body.innerHTML = '<div id="dynamic">New</div>';
      registry.invalidate('dynamic');

      expect(registry.get('dynamic')).not.toBeNull();
      expect(registry.get<HTMLDivElement>('dynamic')!.textContent).toBe('New');
    });
  });

  describe('require', () => {
    it('returns element when present', () => {
      document.body.innerHTML = '<input id="myInput" />';
      const el = registry.require<HTMLInputElement>('myInput');
      expect(el).toBeInstanceOf(HTMLInputElement);
    });

    it('throws when element is missing', () => {
      expect(() => registry.require('missing')).toThrow(
        'Required DOM element "#missing" not found'
      );
    });
  });

  describe('query', () => {
    it('returns element by CSS selector', () => {
      document.body.innerHTML = '<div class="sidebar"><span>Test</span></div>';
      const el = registry.query('.sidebar');
      expect(el).toBeInstanceOf(HTMLDivElement);
    });

    it('returns null for no match', () => {
      expect(registry.query('.nonexistent')).toBeNull();
    });

    it('caches query results', () => {
      document.body.innerHTML = '<div class="box">Box</div>';
      const first = registry.query('.box');
      const second = registry.query('.box');
      expect(first).toBe(second);
    });
  });

  describe('queryAll', () => {
    it('returns all matching elements', () => {
      document.body.innerHTML = '<div class="item">A</div><div class="item">B</div><div class="item">C</div>';
      const items = registry.queryAll('.item');
      expect(items).toHaveLength(3);
      expect(items[0].textContent).toBe('A');
      expect(items[2].textContent).toBe('C');
    });

    it('returns empty array for no matches', () => {
      expect(registry.queryAll('.nope')).toEqual([]);
    });
  });

  describe('invalidate', () => {
    it('clears specific id from cache', () => {
      document.body.innerHTML = '<div id="a">A</div><div id="b">B</div>';
      registry.get('a');
      registry.get('b');

      document.body.innerHTML = '<div id="a">A2</div><div id="b">B</div>';
      registry.invalidate('a');

      expect(registry.get('a')!.textContent).toBe('A2');
      // 'b' is still cached with old reference
    });

    it('clears entire cache when called without args', () => {
      document.body.innerHTML = '<div id="x">X</div>';
      registry.get('x');

      document.body.innerHTML = '<div id="x">X2</div>';
      registry.invalidate();

      expect(registry.get('x')!.textContent).toBe('X2');
    });
  });
});
