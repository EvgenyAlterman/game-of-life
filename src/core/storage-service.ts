/**
 * Centralized localStorage abstraction.
 * All persistent storage goes through this service.
 */

const KEYS = {
  settings: 'gameoflife-settings',
  theme: 'gameoflife-theme',
  customPatterns: 'custom-patterns',
  collapsible: 'gameOfLifeSettings',
} as const;

const SETTINGS_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface StoredSettings {
  timestamp?: number;
  [key: string]: any;
}

export interface CustomPatternData {
  name: string;
  category: string;
  pattern: number[][];
}

export interface CollapsibleState {
  [sectionId: string]: boolean;
}

export class StorageService {
  getSettings(): StoredSettings | null {
    return this.getJSON<StoredSettings>(KEYS.settings, (data) => {
      if (data.timestamp && Date.now() - data.timestamp > SETTINGS_MAX_AGE_MS) {
        this.remove(KEYS.settings);
        return null;
      }
      return data;
    });
  }

  saveSettings(settings: StoredSettings): void {
    settings.timestamp = Date.now();
    this.setJSON(KEYS.settings, settings);
  }

  clearSettings(): void {
    this.remove(KEYS.settings);
  }

  getTheme(): 'dark' | 'light' | null {
    const val = localStorage.getItem(KEYS.theme);
    if (val === 'dark' || val === 'light') return val;
    return null;
  }

  setTheme(theme: 'dark' | 'light'): void {
    localStorage.setItem(KEYS.theme, theme);
  }

  getCustomPatterns(): CustomPatternData[] {
    return this.getJSON<CustomPatternData[]>(KEYS.customPatterns) ?? [];
  }

  saveCustomPatterns(patterns: CustomPatternData[]): void {
    this.setJSON(KEYS.customPatterns, patterns);
  }

  getCollapsibleState(): CollapsibleState {
    return this.getJSON<CollapsibleState>(KEYS.collapsible) ?? {};
  }

  saveCollapsibleState(state: CollapsibleState): void {
    this.setJSON(KEYS.collapsible, state);
  }

  clearAll(): void {
    for (const key of Object.values(KEYS)) {
      this.remove(key);
    }
  }

  private getJSON<T>(key: string, validate?: (data: T) => T | null): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      const data = JSON.parse(raw) as T;
      return validate ? validate(data) : data;
    } catch {
      this.remove(key);
      return null;
    }
  }

  private setJSON(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  private remove(key: string): void {
    localStorage.removeItem(key);
  }
}
