import { EventBus } from '../core/event-bus';
import { DomRegistry } from '../core/dom-registry';

export interface RulesEngine {
  birthRules: number[];
  survivalRules: number[];
  setRulesFromString(s: string): void;
  setBirthRules(rules: number[]): void;
  setSurvivalRules(rules: number[]): void;
  getRulesAsString(): string;
}

export interface CustomRulesState {
  ruleString: string;
}

export class CustomRulesManager {
  private bus: EventBus;
  private dom: DomRegistry;
  private engine: RulesEngine;

  private birthCheckboxes: (HTMLInputElement | null)[] = [];
  private survivalCheckboxes: (HTMLInputElement | null)[] = [];

  constructor(bus: EventBus, dom: DomRegistry, engine: RulesEngine) {
    this.bus = bus;
    this.dom = dom;
    this.engine = engine;
  }

  initialize(): void {
    this.birthCheckboxes = [];
    this.survivalCheckboxes = [];
    for (let i = 0; i <= 8; i++) {
      this.birthCheckboxes.push(this.dom.get<HTMLInputElement>(`birth${i}`));
      this.survivalCheckboxes.push(this.dom.get<HTMLInputElement>(`survival${i}`));
    }

    this.updateRuleDisplay();
    this.updateCheckboxesFromRules();

    const presets = this.dom.get<HTMLSelectElement>('rulePresets');
    const customInputs = this.dom.get<HTMLElement>('customRuleInputs');

    if (presets && customInputs) {
      const currentRule = this.engine.getRulesAsString();
      if (presets.querySelector(`option[value="${currentRule}"]`)) {
        presets.value = currentRule;
        customInputs.style.opacity = '0.6';
        customInputs.style.pointerEvents = 'none';
      } else {
        presets.value = 'custom';
        customInputs.style.opacity = '1';
        customInputs.style.pointerEvents = 'all';
      }
    }
  }

  handlePresetChange(value: string): void {
    const customInputs = this.dom.get<HTMLElement>('customRuleInputs');
    if (value === 'custom') {
      if (customInputs) {
        customInputs.style.opacity = '1';
        customInputs.style.pointerEvents = 'all';
      }
      return;
    }

    this.engine.setRulesFromString(value);
    this.updateRuleDisplay();
    this.updateCheckboxesFromRules();

    if (customInputs) {
      customInputs.style.opacity = '0.6';
      customInputs.style.pointerEvents = 'none';
    }

    this.bus.emit('settings:changed');
  }

  updateFromCheckboxes(): void {
    const birth: number[] = [];
    for (let i = 0; i <= 8; i++) {
      if (this.birthCheckboxes[i]?.checked) birth.push(i);
    }

    const survival: number[] = [];
    for (let i = 0; i <= 8; i++) {
      if (this.survivalCheckboxes[i]?.checked) survival.push(i);
    }

    this.engine.setBirthRules(birth);
    this.engine.setSurvivalRules(survival);
    this.updateRuleDisplay();

    const presets = this.dom.get<HTMLSelectElement>('rulePresets');
    const customInputs = this.dom.get<HTMLElement>('customRuleInputs');
    if (presets) presets.value = 'custom';
    if (customInputs) {
      customInputs.style.opacity = '1';
      customInputs.style.pointerEvents = 'all';
    }

    this.bus.emit('settings:changed');
  }

  updateRuleDisplay(): void {
    const el = this.dom.get<HTMLElement>('currentRuleString');
    if (el) el.textContent = this.engine.getRulesAsString();
  }

  updateCheckboxesFromRules(): void {
    for (let i = 0; i <= 8; i++) {
      if (this.birthCheckboxes[i]) {
        this.birthCheckboxes[i]!.checked = this.engine.birthRules.includes(i);
      }
      if (this.survivalCheckboxes[i]) {
        this.survivalCheckboxes[i]!.checked = this.engine.survivalRules.includes(i);
      }
    }
  }

  getState(): CustomRulesState {
    return { ruleString: this.engine.getRulesAsString() };
  }

  loadState(s: Partial<CustomRulesState>): void {
    if (s.ruleString) {
      this.engine.setRulesFromString(s.ruleString);
      this.updateRuleDisplay();
      this.updateCheckboxesFromRules();
    }
  }
}
