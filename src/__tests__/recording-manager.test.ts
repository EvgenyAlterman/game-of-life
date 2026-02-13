import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    clearStateTracking: vi.fn(),
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
    <button id="timelinePlayBtn"><i class="timeline-bar-icon" data-lucide="play"></i></button>
    <button id="saveRecordingBtn"></button>
    <button id="resetTimelineBtn"></button>
    <button id="closePlaybackBtn" style="display:none"></button>
    <input id="timelineBarSlider" type="range" min="0" max="0" value="0" />
    <span id="timelineBarFrame">0 / 0</span>
    <div id="timelineNormalControls" style="display:flex"></div>
    <div id="timelineRecordingInfo" style="display:none">
      <span id="playbackRecordingName"></span>
      <span id="playbackRecordingDate"></span>
    </div>
    <input id="rangeStart" type="number" min="1" value="1" />
    <input id="rangeEnd" type="number" min="1" value="1" />
    <input id="rangeSliderStart" type="range" min="1" value="1" />
    <input id="rangeSliderEnd" type="range" min="1" value="1" />
    <span id="recordedGenerations">0</span>
    <span id="recordingDuration">0s</span>
    <button id="loadRecordingsBtn"></button>
    <div id="recordingsList"></div>
    <div id="saveModal" style="display:none">
      <input id="recordingName" />
      <button id="modalClose"></button>
      <button id="cancelSave"></button>
      <button id="confirmSave"></button>
    </div>
    <button id="startStopBtn"></button>
    <button id="resetBtn"></button>
    <button id="randomBtn"></button>
    <button id="clearBtn"></button>
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
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('startAutoRecording', () => {
    it('sets state and records initial frame', () => {
      const { rm, engine } = setup();
      rm.startAutoRecording();
      expect(rm.isRecording).toBe(true);
      expect(rm.recordedGenerations).toHaveLength(1);
      expect(engine.getGridSnapshot).toHaveBeenCalled();
    });

    it('emits recording:started', () => {
      const { rm, bus } = setup();
      const handler = vi.fn();
      bus.on('recording:started', handler);
      rm.startAutoRecording();
      expect(handler).toHaveBeenCalled();
    });

    it('is idempotent', () => {
      const { rm } = setup();
      rm.startAutoRecording();
      rm.startAutoRecording();
      expect(rm.recordedGenerations).toHaveLength(1);
    });
  });

  describe('stopAutoRecording', () => {
    it('clears recording state', () => {
      const { rm } = setup();
      rm.startAutoRecording();
      rm.stopAutoRecording();
      expect(rm.isRecording).toBe(false);
      expect(rm.recordingStartTime).toBeNull();
    });

    it('emits recording:stopped', () => {
      const { rm, bus } = setup();
      const handler = vi.fn();
      bus.on('recording:stopped', handler);
      rm.startAutoRecording();
      rm.stopAutoRecording();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('recordGeneration', () => {
    it('captures frame when recording', () => {
      const { rm } = setup();
      rm.startAutoRecording();
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
      rm.startAutoRecording();
      rm.onGenerationUpdate();
      expect(rm.recordedGenerations).toHaveLength(2);
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
      ctx.rm.isInPlaybackMode = true; // Required for updateTimelineState to use replayData
      return ctx;
    }

    it('setupTimeline configures slider range', () => {
      const { rm } = setupWithData();
      rm.setupTimeline();
      const slider = document.getElementById('timelineBarSlider') as HTMLInputElement;
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
      expect(document.getElementById('recordingsList')!.textContent).toContain('10 gen');
    });
  });

  describe('destroy', () => {
    it('clears all state', () => {
      const { rm } = setup();
      rm.startAutoRecording();
      rm.recordedGenerations.push({ timestamp: 0, generation: 0, grid: [], population: 0 });
      rm.destroy();
      expect(rm.isRecording).toBe(false);
      expect(rm.isReplaying).toBe(false);
      expect(rm.recordedGenerations).toHaveLength(0);
      expect(rm.replayData).toBeNull();
    });
  });
});
