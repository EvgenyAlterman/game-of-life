import { describe, it, expect, vi } from 'vitest';
import { CustomRulesManager, RulesEngine } from '../../modules/custom-rules';
import { EventBus } from '../../core/event-bus';
import { DomRegistry } from '../../core/dom-registry';

function createMockEngine(): RulesEngine {
  return {
    birthRules: [3],
    survivalRules: [2, 3],
    setRulesFromString: vi.fn(function (this: any, s: string) {
      // Parse "B3/S23" format
      const match = s.match(/B([\d]*)\/?S([\d]*)/i);
      if (match) {
        this.birthRules = match[1].split('').map(Number);
        this.survivalRules = match[2].split('').map(Number);
      }
    }),
    setBirthRules: vi.fn(function (this: any, r: number[]) { this.birthRules = r; }),
    setSurvivalRules: vi.fn(function (this: any, r: number[]) { this.survivalRules = r; }),
    getRulesAsString: vi.fn(function (this: any) {
      return `B${this.birthRules.join('')}/S${this.survivalRules.join('')}`;
    }),
  };
}

function setupDOM() {
  let html = `
    <select id="rulePresets">
      <option value="B3/S23">Conway</option>
      <option value="custom">Custom</option>
    </select>
    <div id="customRuleInputs" style="opacity:0.6;pointer-events:none"></div>
    <span id="currentRuleString"></span>
  `;
  // Add birth checkboxes 0-8
  for (let i = 0; i <= 8; i++) {
    html += `<input type="checkbox" id="birth${i}" />`;
  }
  // Add survival checkboxes 0-8
  for (let i = 0; i <= 8; i++) {
    html += `<input type="checkbox" id="survival${i}" />`;
  }
  document.body.innerHTML = html;
}

function setup() {
  setupDOM();
  const bus = new EventBus();
  const dom = new DomRegistry();
  const engine = createMockEngine();
  const manager = new CustomRulesManager(bus, dom, engine);
  return { bus, dom, engine, manager };
}

describe('CustomRulesManager', () => {
  describe('initialize', () => {
    it('sets rule display text', () => {
      const { manager } = setup();
      manager.initialize();
      expect(document.getElementById('currentRuleString')!.textContent).toBe('B3/S23');
    });

    it('checks correct birth/survival checkboxes', () => {
      const { manager } = setup();
      manager.initialize();
      expect((document.getElementById('birth3') as HTMLInputElement).checked).toBe(true);
      expect((document.getElementById('birth0') as HTMLInputElement).checked).toBe(false);
      expect((document.getElementById('survival2') as HTMLInputElement).checked).toBe(true);
      expect((document.getElementById('survival3') as HTMLInputElement).checked).toBe(true);
      expect((document.getElementById('survival0') as HTMLInputElement).checked).toBe(false);
    });

    it('selects matching preset if available', () => {
      const { manager } = setup();
      manager.initialize();
      expect((document.getElementById('rulePresets') as HTMLSelectElement).value).toBe('B3/S23');
    });

    it('selects custom if no matching preset', () => {
      const { manager, engine } = setup();
      engine.birthRules = [2, 3];
      manager.initialize();
      expect((document.getElementById('rulePresets') as HTMLSelectElement).value).toBe('custom');
    });
  });

  describe('handlePresetChange', () => {
    it('applies preset rules to engine', () => {
      const { manager, engine } = setup();
      manager.initialize();
      manager.handlePresetChange('B3/S23');
      expect(engine.setRulesFromString).toHaveBeenCalledWith('B3/S23');
    });

    it('enables custom inputs for custom preset', () => {
      const { manager } = setup();
      manager.initialize();
      manager.handlePresetChange('custom');
      const customInputs = document.getElementById('customRuleInputs')!;
      expect(customInputs.style.opacity).toBe('1');
      expect(customInputs.style.pointerEvents).toBe('all');
    });

    it('dims custom inputs for known preset', () => {
      const { manager } = setup();
      manager.initialize();
      manager.handlePresetChange('B3/S23');
      const customInputs = document.getElementById('customRuleInputs')!;
      expect(customInputs.style.opacity).toBe('0.6');
      expect(customInputs.style.pointerEvents).toBe('none');
    });

    it('emits settings:changed for non-custom preset', () => {
      const { manager, bus } = setup();
      manager.initialize();
      const handler = vi.fn();
      bus.on('settings:changed', handler);
      manager.handlePresetChange('B3/S23');
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('updateFromCheckboxes', () => {
    it('reads checked birth/survival checkboxes', () => {
      const { manager, engine } = setup();
      manager.initialize();

      // Check birth 2 and 3, survival 2 and 3
      (document.getElementById('birth2') as HTMLInputElement).checked = true;
      (document.getElementById('birth3') as HTMLInputElement).checked = true;
      (document.getElementById('survival2') as HTMLInputElement).checked = true;
      (document.getElementById('survival3') as HTMLInputElement).checked = true;

      manager.updateFromCheckboxes();

      expect(engine.setBirthRules).toHaveBeenCalledWith([2, 3]);
      expect(engine.setSurvivalRules).toHaveBeenCalledWith([2, 3]);
    });

    it('sets preset to custom', () => {
      const { manager } = setup();
      manager.initialize();
      manager.updateFromCheckboxes();
      expect((document.getElementById('rulePresets') as HTMLSelectElement).value).toBe('custom');
    });

    it('emits settings:changed', () => {
      const { manager, bus } = setup();
      manager.initialize();
      const handler = vi.fn();
      bus.on('settings:changed', handler);
      manager.updateFromCheckboxes();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('updateRuleDisplay', () => {
    it('updates text content', () => {
      const { manager, engine } = setup();
      manager.initialize();
      engine.birthRules = [1, 2];
      engine.survivalRules = [3, 4, 5];
      manager.updateRuleDisplay();
      expect(document.getElementById('currentRuleString')!.textContent).toBe('B12/S345');
    });
  });

  describe('getState / loadState', () => {
    it('round-trips rule string', () => {
      const { manager, engine } = setup();
      manager.initialize();
      const state = manager.getState();
      expect(state.ruleString).toBe('B3/S23');

      engine.birthRules = [1];
      engine.survivalRules = [1];
      manager.loadState(state);
      expect(engine.setRulesFromString).toHaveBeenCalledWith('B3/S23');
    });
  });
});
