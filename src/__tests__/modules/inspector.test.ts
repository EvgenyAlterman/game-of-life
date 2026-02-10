import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InspectorManager } from '../../modules/inspector';

function createMockEngine() {
  return {
    getCell: vi.fn().mockReturnValue(true),
    countNeighbors: vi.fn().mockReturnValue(3),
    getCellFadeLevel: vi.fn().mockReturnValue(2),
    getCellMaturity: vi.fn().mockReturnValue(5),
  };
}

describe('InspectorManager', () => {
  let inspector: InspectorManager;
  let engine: ReturnType<typeof createMockEngine>;

  beforeEach(() => {
    document.body.innerHTML = '';
    engine = createMockEngine();
    inspector = new InspectorManager(engine as any);
  });

  afterEach(() => {
    inspector.hide();
  });

  describe('showCellInfo', () => {
    it('creates a tooltip element', () => {
      inspector.showCellInfo(5, 3, 100, 200);
      const tooltip = document.querySelector('.inspector-tooltip');
      expect(tooltip).not.toBeNull();
    });

    it('includes cell coordinates in tooltip', () => {
      inspector.showCellInfo(5, 3, 100, 200);
      const tooltip = document.querySelector('.inspector-tooltip')!;
      expect(tooltip.textContent).toContain('Cell (5, 3)');
    });

    it('shows alive state', () => {
      engine.getCell.mockReturnValue(true);
      inspector.showCellInfo(0, 0, 100, 200);
      expect(document.querySelector('.inspector-tooltip')!.textContent).toContain('Alive');
    });

    it('shows dead state', () => {
      engine.getCell.mockReturnValue(false);
      inspector.showCellInfo(0, 0, 100, 200);
      expect(document.querySelector('.inspector-tooltip')!.textContent).toContain('Dead');
    });

    it('shows neighbor count', () => {
      engine.countNeighbors.mockReturnValue(5);
      inspector.showCellInfo(0, 0, 100, 200);
      expect(document.querySelector('.inspector-tooltip')!.textContent).toContain('Neighbors: 5');
    });

    it('shows fade level when fadeMode is on', () => {
      inspector.fadeMode = true;
      engine.getCellFadeLevel.mockReturnValue(3);
      inspector.showCellInfo(0, 0, 100, 200);
      expect(document.querySelector('.inspector-tooltip')!.textContent).toContain('Fade Level: 3');
    });

    it('hides fade level when fadeMode is off', () => {
      inspector.fadeMode = false;
      inspector.showCellInfo(0, 0, 100, 200);
      expect(document.querySelector('.inspector-tooltip')!.textContent).not.toContain('Fade Level');
    });

    it('shows maturity when maturityMode is on', () => {
      inspector.maturityMode = true;
      engine.getCellMaturity.mockReturnValue(7);
      inspector.showCellInfo(0, 0, 100, 200);
      expect(document.querySelector('.inspector-tooltip')!.textContent).toContain('Maturity: 7');
    });
  });

  describe('hide', () => {
    it('removes tooltip from DOM', () => {
      inspector.showCellInfo(0, 0, 100, 200);
      expect(document.querySelector('.inspector-tooltip')).not.toBeNull();
      inspector.hide();
      expect(document.querySelector('.inspector-tooltip')).toBeNull();
    });

    it('is safe to call when no tooltip exists', () => {
      expect(() => inspector.hide()).not.toThrow();
    });
  });

  describe('showTooltip', () => {
    it('replaces existing tooltip', () => {
      inspector.showTooltip('First', 10, 10);
      inspector.showTooltip('Second', 20, 20);
      const tooltips = document.querySelectorAll('.inspector-tooltip');
      expect(tooltips).toHaveLength(1);
      expect(tooltips[0].textContent).toBe('Second');
    });
  });
});
