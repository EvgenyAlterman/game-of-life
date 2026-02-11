/**
 * Pattern tree, search, rotation, and custom pattern CRUD.
 */

import type { EventBus } from '../core/event-bus';
import type { StorageService, CustomPatternData } from '../core/storage-service';
import type { DomRegistry } from '../core/dom-registry';

declare const lucide: { createIcons: () => void };

const ICON_MAP: Record<string, string> = {
  block: '⬛', beehive: '🔶', loaf: '🍞', boat: '⛵', ship: '🚢', tub: '🛁',
  pond: '🏊', eater1: '👹', blinker: '⚡', beacon: '🔵', toad: '🐸', clock: '🕐',
  pulsar: '⭐', pentadecathlon: '📏', mazing: '🌀', galaxy: '🌌', glider: '✈️',
  lwss: '🚀', mwss: '🛸', hwss: '🚁', rpentomino: '🌱', diehard: '💀',
  acorn: '🌰', gosperglidergun: '🔫', switchengine: '🚂', reflector: '🪞',
  infinitegrowth1: '📈',
};

const CATEGORY_NAMES: Record<string, string> = {
  custom: 'Custom', oscillators: 'Oscillators', spaceships: 'Spaceships',
  'still-lifes': 'Still Lifes', guns: 'Guns', other: 'Other',
};

const CATEGORY_ICONS: Record<string, string> = {
  custom: '🎨', oscillators: '🔄', spaceships: '🚀',
  'still-lifes': '🏠', guns: '🔫', other: '✨',
};

export class PatternManager {
  private bus: EventBus;
  private storage: StorageService;
  private dom: DomRegistry;

  // Callbacks set by app composer
  onSelectDrawingPattern: (name: string) => void = () => {};
  onSelectCustomPattern: (name: string) => void = () => {};

  constructor(bus: EventBus, storage: StorageService, dom: DomRegistry) {
    this.bus = bus;
    this.storage = storage;
    this.dom = dom;
  }

  // ─── Pattern tree ───────────────────────────────────────

  initializePatternTree(
    patternsLib: {
      categories: Record<string, any>;
      getByCategory: (key: string) => any[];
    },
  ): void {
    this.buildPatternTree(patternsLib);
  }

  buildPatternTree(
    patternsLib: {
      categories: Record<string, any>;
      getByCategory: (key: string) => any[];
    },
  ): void {
    const treeEl = this.dom.get('patternTree');
    if (!treeEl) return;

    const customPatterns = this.storage.getCustomPatterns();
    let html = '';

    if (customPatterns.length > 0) {
      html += this.buildCustomCategory(customPatterns);
    }

    html += Object.keys(patternsLib.categories).map((catKey) => {
      const cat = patternsLib.categories[catKey];
      const subs = cat.subcategories || {};
      const patterns = patternsLib.getByCategory(catKey);

      const subsHTML = Object.keys(subs).map((subKey) => {
        const sub = subs[subKey];
        const subPatterns = patterns.filter((p: any) => p.subcategory === subKey);
        if (!subPatterns.length) return '';

        const items = subPatterns.map((p: any) => `
          <div class="pattern-item" data-pattern="${p.key}" tabindex="0"
               title="${p.description}${p.discoverer ? ' • ' + p.discoverer : ''}${p.year ? ' (' + p.year + ')' : ''}">
            <span class="pattern-icon">${PatternManager.getPatternIcon(p)}</span>
            <span class="pattern-name">${p.name}</span>
            ${p.period ? `<span class="pattern-info">P${p.period}</span>` : ''}
          </div>
        `).join('');

        return `
          <div class="subcategory">
            <div class="subcategory-header" data-subcategory="${subKey}" tabindex="0">
              <i data-lucide="chevron-right" class="subcategory-expand-icon"></i>
              <span class="subcategory-icon">${sub.icon}</span>
              <span class="subcategory-name">${sub.name} (${subPatterns.length})</span>
            </div>
            <div class="subcategory-content">${items}</div>
          </div>
        `;
      }).join('');

      return `
        <div class="tree-category collapsed">
          <div class="category-header" data-category="${catKey}" tabindex="0">
            <i data-lucide="chevron-down" class="expand-icon"></i>
            <span class="category-icon">${cat.icon}</span>
            <span class="category-title">${cat.name}</span>
            <span class="category-count">${patterns.length}</span>
          </div>
          <div class="category-content">${subsHTML}</div>
        </div>
      `;
    }).join('');

    treeEl.innerHTML = html;
    this.setupTreeListeners();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  private setupTreeListeners(): void {
    document.querySelectorAll('.pattern-item').forEach((item) => {
      const el = item as HTMLElement;
      const handler = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.closest('.pattern-delete')) {
          e.stopPropagation();
          const name = (target.closest('.pattern-delete') as HTMLElement).dataset.patternName;
          if (name) this.deleteCustomPattern(name);
          return;
        }
        const key = el.dataset.pattern!;
        if (el.dataset.custom === 'true') {
          this.onSelectCustomPattern(key);
        } else {
          this.onSelectDrawingPattern(key);
        }
      };
      el.addEventListener('click', handler);
      el.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(e); }
      });
    });

    document.querySelectorAll('.category-header, .subcategory-header').forEach((header) => {
      header.addEventListener('click', () => {
        const parent = header.parentElement!;
        parent.classList.toggle('expanded');
        parent.classList.toggle('collapsed');
        const icon = header.querySelector('.expand-icon, .subcategory-expand-icon');
        if (icon) {
          icon.setAttribute('data-lucide', parent.classList.contains('expanded') ? 'chevron-down' : 'chevron-right');
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }
      });
    });
  }

  private buildCustomCategory(patterns: CustomPatternData[]): string {
    const grouped: Record<string, CustomPatternData[]> = {};
    patterns.forEach((p) => {
      const cat = p.category || 'custom';
      (grouped[cat] ??= []).push(p);
    });

    const subsHTML = Object.keys(grouped).map((catKey) => {
      const items = grouped[catKey].map((p) => `
        <div class="pattern-item custom-pattern" data-pattern="${p.name}" data-custom="true" tabindex="0"
             title="${p.name} • Custom Pattern">
          <span class="pattern-icon">🎨</span>
          <span class="pattern-name">${p.name}</span>
          <button class="pattern-delete" data-pattern-name="${p.name}" title="Delete this pattern">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `).join('');

      return `
        <div class="subcategory expanded">
          <div class="subcategory-header" data-subcategory="custom-${catKey}" tabindex="0">
            <i data-lucide="chevron-down" class="subcategory-expand-icon"></i>
            <span class="subcategory-icon">${CATEGORY_ICONS[catKey] || '🎨'}</span>
            <span class="subcategory-name">${CATEGORY_NAMES[catKey] || 'Custom'} (${grouped[catKey].length})</span>
          </div>
          <div class="subcategory-content">${items}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="tree-category expanded" data-category="my-patterns">
        <div class="category-header" tabindex="0">
          <i data-lucide="chevron-down" class="expand-icon"></i>
          <span class="category-icon">💾</span>
          <span class="category-title">My Patterns</span>
          <span class="category-count">${patterns.length}</span>
        </div>
        <div class="category-content">${subsHTML}</div>
      </div>
    `;
  }

  // ─── Pattern Selection ─────────────────────────────────

  selectPattern(name: string): void {
    this.onSelectDrawingPattern(name);
  }

  // ─── Search ─────────────────────────────────────────────

  private searchFn: ((q: string) => any[]) | null = null;

  setSearchFunction(fn: (q: string) => any[]): void {
    this.searchFn = fn;
  }

  handleSearch(query: string, searchFn?: (q: string) => any[]): void {
    if (!query.trim()) {
      this.clearSearch();
      return;
    }
    const fn = searchFn || this.searchFn;
    if (!fn) return;
    const results = fn(query);
    this.displaySearchResults(results);
  }

  private displaySearchResults(results: any[]): void {
    const resultsEl = this.dom.get('searchResults');
    const treeEl = this.dom.get('patternTree');
    if (!resultsEl) return;

    if (!results.length) {
      resultsEl.innerHTML = '<h4>Search Results</h4><div class="no-results">No patterns found.</div>';
    } else {
      const html = results.map((p) => `
        <div class="search-result-item" data-pattern="${p.key || p.name}"
             title="${p.description}">
          <div class="search-result-header">
            <span class="pattern-icon">${PatternManager.getPatternIcon(p)}</span>
            <span class="search-result-name">${p.name}</span>
          </div>
          <div class="search-result-description">${p.description}</div>
        </div>
      `).join('');
      resultsEl.innerHTML = `<h4>Search Results (${results.length})</h4><div class="search-results-list">${html}</div>`;

      resultsEl.querySelectorAll('.search-result-item').forEach((item) => {
        item.addEventListener('click', () => {
          const name = (item as HTMLElement).dataset.pattern!;
          this.onSelectDrawingPattern(name);
        });
      });
    }
    resultsEl.style.display = 'block';
    if (treeEl) treeEl.style.display = 'none';
  }

  clearSearch(): void {
    const search = this.dom.get<HTMLInputElement>('patternSearch');
    const resultsEl = this.dom.get('searchResults');
    const treeEl = this.dom.get('patternTree');
    if (search) search.value = '';
    if (resultsEl) resultsEl.style.display = 'none';
    if (treeEl) treeEl.style.display = 'block';
  }

  // ─── Custom patterns ───────────────────────────────────

  deleteCustomPattern(name: string): void {
    const patterns = this.storage.getCustomPatterns().filter((p) => p.name !== name);
    this.storage.saveCustomPatterns(patterns);
  }

  saveCustomPattern(data: CustomPatternData): void {
    const patterns = this.storage.getCustomPatterns();
    const idx = patterns.findIndex((p) => p.name === data.name);
    if (idx !== -1) {
      patterns[idx] = data;
    } else {
      patterns.push(data);
    }
    this.storage.saveCustomPatterns(patterns);
  }

  // ─── Rotation ───────────────────────────────────────────

  static rotatePattern(pattern: number[][], degrees: number): number[][] {
    if (!pattern || degrees === 0) return pattern;
    let rotated = pattern;
    const times = ((degrees / 90) % 4 + 4) % 4;
    for (let i = 0; i < times; i++) {
      rotated = PatternManager.rotateMatrix90(rotated);
    }
    return rotated;
  }

  static rotateMatrix90(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated: number[][] = [];
    for (let i = 0; i < cols; i++) {
      rotated[i] = [];
      for (let j = 0; j < rows; j++) {
        rotated[i][j] = matrix[rows - 1 - j][i];
      }
    }
    return rotated;
  }

  static getPatternIcon(pattern: { key?: string; name: string }): string {
    return ICON_MAP[pattern.key || pattern.name] || '🔹';
  }
}
