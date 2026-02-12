/**
 * Typed publish/subscribe event bus for inter-module communication.
 */

export interface EventMap {
  // Simulation events
  'simulation:start': void;
  'simulation:stop': void;
  'simulation:tick': { generation: number; population: number };
  'simulation:reset': void;
  'simulation:speedChanged': { speed: number };

  // Grid events
  'grid:cleared': void;
  'grid:resized': { rows: number; cols: number; cellSize: number };
  'grid:cellToggled': { row: number; col: number };

  // Tool events
  'tool:changed': { mode: string; pattern?: string };
  'pattern:selected': { name: string; pattern: number[][] };
  'pattern:rotated': { pattern: number[][] };

  // Visual events
  'visual:gridToggled': { show: boolean };
  'visual:pixelGridToggled': { show: boolean };
  'visual:fadeToggled': { show: boolean };
  'visual:maturityToggled': { show: boolean };
  'visual:cellShapeChanged': { shape: string };
  'visual:maturityColorChanged': { color: string };

  // UI events
  'ui:themeChanged': { theme: 'dark' | 'light' };
  'ui:fullscreenEnter': void;
  'ui:fullscreenExit': void;
  'ui:sidebarToggled': { open: boolean };

  // Canvas events
  'canvas:needsRedraw': void;

  // Settings events
  'settings:changed': void;
  'settings:loaded': void;
  'settings:imported': void;
  'settings:importFailed': string;

  // Auto-stop events
  'autostop:triggered': { generation: number };

  // Recording events
  'recording:started': void;
  'recording:stopped': void;
  'recording:frameAdded': { generation: number };

  // Allow arbitrary string events for extensibility
  [key: string]: any;
}

type Handler<T> = T extends void ? () => void : (payload: T) => void;

export class EventBus {
  private handlers = new Map<string, Set<Function>>();

  on<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): () => void {
    if (!this.handlers.has(event as string)) {
      this.handlers.set(event as string, new Set());
    }
    this.handlers.get(event as string)!.add(handler);

    return () => this.off(event, handler);
  }

  off<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): void {
    this.handlers.get(event as string)?.delete(handler);
  }

  emit<K extends keyof EventMap>(
    event: K,
    ...args: EventMap[K] extends void ? [] : [EventMap[K]]
  ): void {
    const handlers = this.handlers.get(event as string);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(...args);
    }
  }

  once<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): () => void {
    const wrapper = ((...args: any[]) => {
      this.off(event, wrapper as Handler<EventMap[K]>);
      (handler as Function)(...args);
    }) as Handler<EventMap[K]>;

    return this.on(event, wrapper);
  }

  destroy(): void {
    this.handlers.clear();
  }
}
