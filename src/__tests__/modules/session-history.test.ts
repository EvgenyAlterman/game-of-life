import { describe, it, expect, vi } from 'vitest';
import { SessionHistoryManager, SessionEngine } from '../../modules/session-history';
import { EventBus } from '../../core/event-bus';

function createMockEngine(gen = 0): SessionEngine {
  const grid = Array.from({ length: 5 }, () => Array(5).fill(false));
  return {
    generation: gen,
    getPopulation: vi.fn(() => 0),
    getGridSnapshot: vi.fn(() => ({
      grid: grid.map(r => [...r]),
      generation: gen,
    })),
    restoreFromSnapshot: vi.fn(),
  };
}

function setup(gen = 0) {
  document.body.innerHTML = '';
  const bus = new EventBus();
  const engine = createMockEngine(gen);
  const manager = new SessionHistoryManager(bus, engine);
  return { bus, engine, manager };
}

describe('SessionHistoryManager', () => {
  describe('addFrame', () => {
    it('captures a snapshot', () => {
      const { manager } = setup();
      manager.addFrame();
      expect(manager.history).toHaveLength(1);
      expect(manager.history[0].generation).toBe(0);
    });

    it('does not add frames during replay', () => {
      const { manager } = setup();
      manager.addFrame();
      manager.isReplaying = true;
      manager.addFrame();
      expect(manager.history).toHaveLength(1);
    });

    it('updates replayIndex to latest', () => {
      const { manager, engine } = setup();
      manager.addFrame();
      engine.generation = 5;
      manager.addFrame();
      expect(manager.replayIndex).toBe(1);
    });
  });

  describe('showTimeline', () => {
    it('does nothing with <= 1 frames', () => {
      const { manager } = setup();
      manager.addFrame();
      manager.showTimeline();
      expect(document.getElementById('sessionTimeline')).toBeNull();
      expect(manager.timelineVisible).toBe(false);
    });

    it('creates timeline element with 2+ frames', () => {
      const { manager, engine } = setup();
      manager.addFrame();
      engine.generation = 10;
      manager.addFrame();
      manager.showTimeline();
      expect(document.getElementById('sessionTimeline')).not.toBeNull();
      expect(manager.timelineVisible).toBe(true);
    });

    it('does not create duplicate timelines', () => {
      const { manager, engine } = setup();
      manager.addFrame();
      engine.generation = 5;
      manager.addFrame();
      manager.showTimeline();
      manager.showTimeline(); // second call
      expect(document.querySelectorAll('#sessionTimeline')).toHaveLength(1);
    });

    it('slider has correct max value', () => {
      const { manager, engine } = setup();
      manager.addFrame();
      engine.generation = 1;
      manager.addFrame();
      engine.generation = 2;
      manager.addFrame();
      manager.showTimeline();
      const slider = document.getElementById('sessionTimelineSlider') as HTMLInputElement;
      expect(slider.max).toBe('2');
    });
  });

  describe('hideTimeline', () => {
    it('removes timeline from DOM', () => {
      const { manager, engine } = setup();
      manager.addFrame();
      engine.generation = 1;
      manager.addFrame();
      manager.showTimeline();
      manager.hideTimeline();
      expect(document.getElementById('sessionTimeline')).toBeNull();
      expect(manager.timelineVisible).toBe(false);
    });

    it('is safe when no timeline exists', () => {
      const { manager } = setup();
      expect(() => manager.hideTimeline()).not.toThrow();
    });

    it('exits replay if replaying', () => {
      const { manager, engine } = setup();
      manager.addFrame();
      engine.generation = 1;
      manager.addFrame();
      manager.showTimeline();
      manager.seek(0); // enter replay
      expect(manager.isReplaying).toBe(true);
      manager.hideTimeline();
      expect(manager.isReplaying).toBe(false);
    });
  });

  describe('seek', () => {
    it('ignores out-of-range index', () => {
      const { manager } = setup();
      manager.addFrame();
      manager.seek(5);
      expect(manager.replayIndex).toBe(0);
    });

    it('restores engine state from frame', () => {
      const { manager, engine } = setup();
      manager.addFrame();
      engine.generation = 10;
      manager.addFrame();

      manager.seek(0);
      expect(engine.restoreFromSnapshot).toHaveBeenCalled();
      expect(engine.generation).toBe(0);
      expect(manager.isReplaying).toBe(true);
    });

    it('calls onStateRestored callback', () => {
      const { manager, engine } = setup();
      manager.addFrame();
      engine.generation = 5;
      manager.addFrame();

      const cb = vi.fn();
      manager.onStateRestored = cb;
      manager.seek(0);
      expect(cb).toHaveBeenCalled();
    });

    it('updates timeline UI elements', () => {
      const { manager, engine } = setup();
      manager.addFrame();
      engine.generation = 42;
      manager.addFrame();
      manager.showTimeline();

      manager.seek(0);

      expect(document.getElementById('sessionCurrentGen')!.textContent).toBe('0');
      expect(document.getElementById('sessionFrameInfo')!.textContent).toBe('1 / 2');
    });
  });

  describe('exitReplay', () => {
    it('does nothing if not replaying', () => {
      const { manager, engine } = setup();
      manager.exitReplay();
      expect(engine.restoreFromSnapshot).not.toHaveBeenCalled();
    });

    it('restores latest frame', () => {
      const { manager, engine } = setup();
      manager.addFrame();
      engine.generation = 100;
      manager.addFrame();
      manager.seek(0);

      manager.exitReplay();
      expect(manager.isReplaying).toBe(false);
      expect(manager.replayIndex).toBe(1);
      // restoreFromSnapshot called for the latest frame
      expect(engine.restoreFromSnapshot).toHaveBeenCalledTimes(2); // seek + exit
    });

    it('calls onStateRestored', () => {
      const { manager, engine } = setup();
      manager.addFrame();
      engine.generation = 1;
      manager.addFrame();
      manager.seek(0);

      const cb = vi.fn();
      manager.onStateRestored = cb;
      manager.exitReplay();
      expect(cb).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('resets all state', () => {
      const { manager, engine } = setup();
      manager.addFrame();
      engine.generation = 1;
      manager.addFrame();
      manager.showTimeline();

      manager.clear();
      expect(manager.history).toHaveLength(0);
      expect(manager.replayIndex).toBe(0);
      expect(manager.isReplaying).toBe(false);
      expect(manager.timelineVisible).toBe(false);
    });
  });
});
