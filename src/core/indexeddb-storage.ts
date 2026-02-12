/**
 * IndexedDB Storage Service for Recordings
 * Provides persistent client-side storage for recordings without server dependency
 */

import type { RecordingListItem } from '../types/game-types';

// Flexible recording data that accepts partial settings
export interface RecordingDataInput {
  generations: Array<{
    timestamp: number;
    generation: number;
    grid: boolean[][];
    population: number;
  }>;
  settings: {
    cellSize?: number;
    rows?: number;
    cols?: number;
    speed?: number;
    customRules?: {
      birthRules: number[];
      survivalRules: number[];
    };
    [key: string]: unknown;
  };
  metadata: {
    totalGenerations: number;
    duration: number;
    ruleString: string;
  };
}

const DB_NAME = 'gameoflife-recordings';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

export interface StoredRecording {
  id: string;
  name: string;
  timestamp: number;
  data: RecordingDataInput;
}

export interface ExportedRecording {
  version: 1;
  type: 'single';
  recording: StoredRecording;
}

export interface ExportedRecordingCollection {
  version: 1;
  type: 'collection';
  recordings: StoredRecording[];
}

export type ExportFormat = ExportedRecording | ExportedRecordingCollection;

class RecordingStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  private generateId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async saveRecording(name: string, data: RecordingDataInput): Promise<string> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    const recording: StoredRecording = {
      id,
      name,
      timestamp: Date.now(),
      data,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(recording);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getRecordings(): Promise<RecordingListItem[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const recordings: StoredRecording[] = request.result;
        const items: RecordingListItem[] = recordings
          .sort((a, b) => b.timestamp - a.timestamp)
          .map((rec) => {
            const date = new Date(rec.timestamp);
            return {
              id: rec.id,
              name: rec.name,
              timestamp: rec.timestamp,
              totalGenerations: rec.data.metadata?.totalGenerations ?? rec.data.generations.length,
              date: date.toLocaleDateString(),
              time: date.toLocaleTimeString(),
              ruleString: rec.data.metadata?.ruleString,
            };
          });
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getRecording(id: string): Promise<RecordingDataInput | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const recording: StoredRecording | undefined = request.result;
        resolve(recording?.data ?? null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getFullRecording(id: string): Promise<StoredRecording | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllRecordings(): Promise<StoredRecording[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteRecording(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ---- Export/Import ----

  async exportRecording(id: string): Promise<ExportedRecording | null> {
    const recording = await this.getFullRecording(id);
    if (!recording) return null;

    return {
      version: 1,
      type: 'single',
      recording,
    };
  }

  async exportAllRecordings(): Promise<ExportedRecordingCollection> {
    const recordings = await this.getAllRecordings();
    return {
      version: 1,
      type: 'collection',
      recordings,
    };
  }

  async importRecording(data: ExportFormat): Promise<string[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const importedIds: string[] = [];

    if (data.type === 'single') {
      const newId = await this.importSingleRecording(data.recording);
      importedIds.push(newId);
    } else if (data.type === 'collection') {
      for (const recording of data.recordings) {
        const newId = await this.importSingleRecording(recording);
        importedIds.push(newId);
      }
    }

    return importedIds;
  }

  private async importSingleRecording(recording: StoredRecording): Promise<string> {
    // Generate new ID to avoid conflicts
    const newId = this.generateId();
    const newRecording: StoredRecording = {
      ...recording,
      id: newId,
      timestamp: Date.now(), // Update timestamp to import time
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(newRecording);

      request.onsuccess = () => resolve(newId);
      request.onerror = () => reject(request.error);
    });
  }

  validateImportData(data: unknown): data is ExportFormat {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;

    if (obj.version !== 1) return false;
    if (obj.type !== 'single' && obj.type !== 'collection') return false;

    if (obj.type === 'single') {
      return this.validateRecording(obj.recording);
    } else {
      if (!Array.isArray(obj.recordings)) return false;
      return obj.recordings.every((rec) => this.validateRecording(rec));
    }
  }

  private validateRecording(rec: unknown): boolean {
    if (!rec || typeof rec !== 'object') return false;
    const obj = rec as Record<string, unknown>;

    if (typeof obj.name !== 'string') return false;
    if (!obj.data || typeof obj.data !== 'object') return false;

    const data = obj.data as Record<string, unknown>;
    if (!Array.isArray(data.generations)) return false;

    return true;
  }
}

// Export singleton instance
export const recordingStorage = new RecordingStorage();

// Helper function to trigger file download
export function downloadJson(data: object, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper function to read file as JSON
export function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        resolve(data);
      } catch (e) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
