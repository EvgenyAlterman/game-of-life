import { describe, it, expect, vi, afterEach } from 'vitest';
import { RecordingManager, RecordingEngine, RecordingHost } from '../recording-manager';
import { EventBus } from '../core/event-bus';
import { DomRegistry } from '../core/dom-registry';

function createMockEngine(): RecordingEngine {
  return {
    grid: [[false, true], [true, false]],
    generation: 42,
    birthRules: [3],
    survivalRules: [2, 3],
    getGridSnapshot: vi.fn(() => ({
      grid: [[false, true], [true, false]],
      generation: 42,
      population: 2,
    })),
    getRulesAsString: vi.fn(() => 'B3/S23'),
    setBirthRules: vi.fn(),
    setSurvivalRules: vi.fn(),
  };
}

function createMockHost(): RecordingHost {
  return {
    cellSize: 10,
    rows: 10,
    cols: 10,
    speed: 5,
    isRunning: false,
    draw: vi.fn(),
    updateInfo: vi.fn(),
    toggleSimulation: vi.fn(),
    updateRuleDisplay: vi.fn(),
    updateCheckboxesFromRules: vi.fn(),
  };
}

function setupDOM() {
  document.body.innerHTML = `
    <button id="recordBtn"><span class="btn-icon" data-lucide="circle"></span></button>
    <button id="finishBtn" style="display:none"></button>
    <button id="playTimelineBtn"></button>
    <button id="pauseTimelineBtn" style="display:none"></button>
    <button id="stopTimelineBtn"></button>
    <input id="timelineSlider" type="range" min="0" max="0" value="0" />
    <input id="playbackSpeed" type="range" min="1" max="10" value="5" />
    <span id="currentFrame">0</span>
    <span id="totalFrames">0</span>
    <span id="speedValue">5x</span>
    <div id="timelineSection" style="display:none"></div>
    <button id="loadRecordingsBtn"></button>
    <div id="recordingsList"></div>
    <div id="saveModal" style="display:none">
      <input id="recordingName" />
      <button id="modalClose"></button>
      <button id="cancelSave"></button>
      <button id="confirmSave"></button>
    </div>
  `;
}

function setup() {
  setupDOM();
  const bus = new EventBus();
  const dom = new DomRegistry();
  const engine = createMockEngine();
  const host = createMockHost();
  const rm = new RecordingManager(bus, dom, engine, host);
  return { bus, dom, engine, host, rm };
}

describe('RecordingManager', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('toggleRecording', () => {
    it('starts recording when not recording', () => {
      const { rm } = setup();
      rm.toggleRecording();
      expect(rm.isRecording).toBe(true);
    });

    it('stops recording when already recording', () => {
      const { rm } = setup();
      rm.startRecording();
      rm.toggleRecording();
      expect(rm.isRecording).toBe(false);
    });
  });

  describe('startRecording', () => {
    it('sets state and records initial frame', () => {
      const { rm, engine } = setup();
      rm.startRecording();
      expect(rm.isRecording).toBe(true);
      expect(rm.recordedGenerations).toHaveLength(1);
      expect(engine.getGridSnapshot).toHaveBeenCalled();
    });

    it('emits recording:started', () => {
      const { rm, bus } = setup();
      const handler = vi.fn();
      bus.on('recording:started', handler);
      rm.startRecording();
      expect(handler).toHaveBeenCalled();
    });

    it('is idempotent', () => {
      const { rm } = setup();
      rm.startRecording();
      rm.startRecording();
      expect(rm.recordedGenerations).toHaveLength(1);
    });
  });

  describe('stopRecording', () => {
    it('clears recording state', () => {
      const { rm } = setup();
      rm.startRecording();
      rm.stopRecording();
      expect(rm.isRecording).toBe(false);
      expect(rm.recordingStartTime).toBeNull();
    });

    it('emits recording:stopped', () => {
      const { rm, bus } = setup();
      const handler = vi.fn();
      bus.on('recording:stopped', handler);
      rm.startRecording();
      rm.stopRecording();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('recordGeneration', () => {
    it('captures frame when recording', () => {
      const { rm } = setup();
      rm.startRecording();
      rm.recordGeneration();
      expect(rm.recordedGenerations).toHaveLength(2); // 1 from start + 1 manual
    });

    it('ignores when not recording', () => {
      const { rm } = setup();
      rm.recordGeneration();
      expect(rm.recordedGenerations).toHaveLength(0);
    });
  });

  describe('onGenerationUpdate', () => {
    it('records when recording', () => {
      const { rm } = setup();
      rm.startRecording();
      rm.onGenerationUpdate();
      expect(rm.recordedGenerations).toHaveLength(2);
    });
  });

  describe('finishRecording', () => {
    it('stops recording and opens save modal', () => {
      const { rm } = setup();
      rm.startRecording();
      rm.finishRecording();
      expect(rm.isRecording).toBe(false);
      expect(document.getElementById('saveModal')!.style.display).toBe('flex');
    });

    it('does nothing when not recording', () => {
      const { rm } = setup();
      rm.finishRecording();
      expect(document.getElementById('saveModal')!.style.display).toBe('none');
    });
  });

  describe('timeline', () => {
    function setupWithData() {
      const ctx = setup();
      ctx.rm.replayData = [
        { timestamp: 0, generation: 0, grid: [[false]], population: 0 },
        { timestamp: 100, generation: 1, grid: [[true]], population: 1 },
        { timestamp: 200, generation: 2, grid: [[false]], population: 0 },
      ];
      return ctx;
    }

    it('setupTimeline shows timeline section', () => {
      const { rm } = setupWithData();
      rm.setupTimeline();
      expect(document.getElementById('timelineSection')!.style.display).toBe('block');
    });

    it('setupTimeline configures slider range', () => {
      const { rm } = setupWithData();
      rm.setupTimeline();
      const slider = document.getElementById('timelineSlider') as HTMLInputElement;
      expect(slider.max).toBe('2');
    });

    it('showReplayFrame updates engine and host', () => {
      const { rm, engine, host } = setupWithData();
      rm.showReplayFrame(1);
      expect(engine.generation).toBe(1);
      expect(host.draw).toHaveBeenCalled();
      expect(host.updateInfo).toHaveBeenCalled();
    });

    it('seekTimeline updates index and shows frame', () => {
      const { rm, host } = setupWithData();
      rm.seekTimeline(2);
      expect(rm.replayIndex).toBe(2);
      expect(host.draw).toHaveBeenCalled();
    });

    it('playTimeline sets replaying state', () => {
      const { rm } = setupWithData();
      rm.playTimeline();
      expect(rm.isReplaying).toBe(true);
      rm.pauseTimeline(); // cleanup
    });

    it('pauseTimeline stops replaying', () => {
      const { rm } = setupWithData();
      rm.playTimeline();
      rm.pauseTimeline();
      expect(rm.isReplaying).toBe(false);
      expect(rm.replayInterval).toBeNull();
    });

    it('stopTimeline resets to beginning', () => {
      const { rm } = setupWithData();
      rm.replayIndex = 2;
      rm.stopTimeline();
      expect(rm.replayIndex).toBe(0);
      expect(rm.isReplaying).toBe(false);
    });
  });

  describe('closeModal', () => {
    it('hides modal and clears name', () => {
      const { rm } = setup();
      document.getElementById('saveModal')!.style.display = 'flex';
      (document.getElementById('recordingName') as HTMLInputElement).value = 'test';
      rm.closeModal();
      expect(document.getElementById('saveModal')!.style.display).toBe('none');
      expect((document.getElementById('recordingName') as HTMLInputElement).value).toBe('');
    });
  });

  describe('displayRecordings', () => {
    it('shows message when no recordings', () => {
      const { rm } = setup();
      rm.displayRecordings([]);
      expect(document.getElementById('recordingsList')!.textContent).toContain('No recordings');
    });

    it('renders recording items', () => {
      const { rm } = setup();
      rm.displayRecordings([
        { id: '1', name: 'Test', date: '2024-01-01', time: '12:00', totalGenerations: 10, ruleString: 'B3/S23' } as any,
      ]);
      expect(document.getElementById('recordingsList')!.textContent).toContain('Test');
      expect(document.getElementById('recordingsList')!.textContent).toContain('10 generations');
    });
  });

  describe('destroy', () => {
    it('clears all state', () => {
      const { rm } = setup();
      rm.startRecording();
      rm.recordedGenerations.push({ timestamp: 0, generation: 0, grid: [], population: 0 });
      rm.destroy();
      expect(rm.isRecording).toBe(false);
      expect(rm.isReplaying).toBe(false);
      expect(rm.recordedGenerations).toHaveLength(0);
      expect(rm.replayData).toBeNull();
    });
  });
});
