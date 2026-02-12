/**
 * Export and import settings as JSON files.
 */

import type { SettingsSnapshot } from './settings-persistence';

const EXPORT_VERSION = 1;
const EXPORT_FILENAME = 'gameoflife-settings.json';

export interface ExportedSettings {
  version: number;
  exportedAt: number;
  settings: SettingsSnapshot;
}

export interface ImportResult {
  success: boolean;
  settings?: SettingsSnapshot;
  error?: string;
}

/**
 * Export settings to a downloadable JSON file.
 */
export function exportSettings(settings: SettingsSnapshot): void {
  const exportData: ExportedSettings = {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    settings,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = EXPORT_FILENAME;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate imported settings JSON.
 */
export function parseImportedSettings(json: string): ImportResult {
  try {
    const data = JSON.parse(json);

    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid JSON structure' };
    }

    // Handle both wrapped format (with version) and raw settings
    const settings = data.settings || data;

    if (!isValidSettings(settings)) {
      return { success: false, error: 'Invalid settings format' };
    }

    return { success: true, settings };
  } catch {
    return { success: false, error: 'Failed to parse JSON' };
  }
}

/**
 * Validate that the object looks like settings.
 */
function isValidSettings(obj: unknown): obj is SettingsSnapshot {
  if (!obj || typeof obj !== 'object') return false;

  // Check for at least one expected property
  const s = obj as Record<string, unknown>;
  return (
    'gridSettings' in s ||
    'visualSettings' in s ||
    'speed' in s ||
    'customRules' in s
  );
}

/**
 * Trigger file input for importing settings.
 */
export function triggerImport(onImport: (result: ImportResult) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';

  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) {
      onImport({ success: false, error: 'No file selected' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = parseImportedSettings(reader.result as string);
      onImport(result);
    };
    reader.onerror = () => {
      onImport({ success: false, error: 'Failed to read file' });
    };
    reader.readAsText(file);
  };

  input.click();
}
