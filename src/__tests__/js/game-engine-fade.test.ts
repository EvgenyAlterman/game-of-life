import { describe, it, expect, beforeEach } from 'vitest';
import { GameOfLifeEngine } from '../../js/game-engine';

describe('GameOfLifeEngine - Trail/Fade Feature', () => {
  let engine: GameOfLifeEngine;

  beforeEach(() => {
    engine = new GameOfLifeEngine(5, 5);
  });

  describe('updateFadeGrid', () => {
    it('sets fade level when a cell dies', () => {
      // Set up a cell that will die (no neighbors to sustain it)
      engine.setCell(2, 2, true);
      engine.maturityGrid[2][2] = 3; // Cell has been alive for a while

      // Run one generation - cell should die (no neighbors)
      engine.updateGeneration();

      // Update fade grid with duration of 5
      engine.updateFadeGrid(5);

      // Cell that just died should have fade level equal to duration
      expect(engine.getCellFadeLevel(2, 2)).toBe(5);
    });

    it('decreases fade level each iteration', () => {
      // Set up initial fade on a cell that is dead and has been dead
      engine.fadeGrid[2][2] = 5;
      engine.grid[2][2] = false;
      engine.deadGrid[2][2] = 1; // Already dead for 1 generation (not just died)

      // Update fade grid - should decrease by 1
      engine.updateFadeGrid(5);

      expect(engine.getCellFadeLevel(2, 2)).toBe(4);
    });

    it('fades completely over N iterations', () => {
      const fadeDuration = 5;

      // Set up a dying cell
      engine.setCell(2, 2, true);
      engine.updateGeneration(); // Cell dies
      engine.updateFadeGrid(fadeDuration);

      expect(engine.getCellFadeLevel(2, 2)).toBe(fadeDuration);

      // Simulate N more iterations
      for (let i = fadeDuration - 1; i >= 0; i--) {
        engine.updateGeneration();
        engine.updateFadeGrid(fadeDuration);
        expect(engine.getCellFadeLevel(2, 2)).toBe(i);
      }

      // After fadeDuration iterations, fade should be 0
      expect(engine.getCellFadeLevel(2, 2)).toBe(0);
    });

    it('each dying cell gets its own fade duration', () => {
      const fadeDuration = 3;

      // Set up two cells that will die at different times
      engine.setCell(1, 1, true);
      engine.setCell(3, 3, true);
      engine.setCell(3, 4, true); // Give cell at 3,3 a neighbor so it survives one more round

      // First generation - cell at 1,1 dies, cell at 3,3 survives
      engine.updateGeneration();
      engine.updateFadeGrid(fadeDuration);

      expect(engine.getCellFadeLevel(1, 1)).toBe(3); // Just died
      expect(engine.getCell(3, 3)).toBe(false); // Also dies (not enough neighbors)
      expect(engine.getCellFadeLevel(3, 3)).toBe(3);

      // Second generation
      engine.updateGeneration();
      engine.updateFadeGrid(fadeDuration);

      expect(engine.getCellFadeLevel(1, 1)).toBe(2); // Fading
      expect(engine.getCellFadeLevel(3, 3)).toBe(2); // Also fading
    });

    it('resets fade when cell becomes alive again', () => {
      // Set up fade
      engine.fadeGrid[2][2] = 3;

      // Make cell alive
      engine.grid[2][2] = true;

      // Update fade grid
      engine.updateFadeGrid(5);

      // Fade should be reset to 0 for alive cells
      expect(engine.getCellFadeLevel(2, 2)).toBe(0);
    });

    it('does not set fade for cells that were already dead', () => {
      // Cell is already dead and has been for a while
      engine.grid[2][2] = false;
      engine.deadGrid[2][2] = 5; // Dead for 5 generations

      engine.updateFadeGrid(5);

      // Should not start a new fade
      expect(engine.getCellFadeLevel(2, 2)).toBe(0);
    });

    it('handles different fade durations correctly', () => {
      // Test with duration of 1
      engine.setCell(1, 1, true);
      engine.updateGeneration();
      engine.updateFadeGrid(1);
      expect(engine.getCellFadeLevel(1, 1)).toBe(1);

      // Next iteration should fade to 0
      engine.updateGeneration();
      engine.updateFadeGrid(1);
      expect(engine.getCellFadeLevel(1, 1)).toBe(0);

      // Test with duration of 10
      engine.setCell(3, 3, true);
      engine.updateGeneration();
      engine.updateFadeGrid(10);
      expect(engine.getCellFadeLevel(3, 3)).toBe(10);
    });

    it('properly tracks multiple cells fading at different rates', () => {
      const fadeDuration = 5;

      // Cell 1 dies at generation 1
      engine.setCell(0, 0, true);
      engine.updateGeneration();
      engine.updateFadeGrid(fadeDuration);
      expect(engine.getCellFadeLevel(0, 0)).toBe(5);

      // Generation 2: Cell 2 dies, Cell 1 continues fading
      engine.setCell(4, 4, true);
      engine.updateGeneration();
      engine.updateFadeGrid(fadeDuration);
      expect(engine.getCellFadeLevel(0, 0)).toBe(4); // Still fading
      expect(engine.getCellFadeLevel(4, 4)).toBe(5); // Just started

      // Generation 3
      engine.updateGeneration();
      engine.updateFadeGrid(fadeDuration);
      expect(engine.getCellFadeLevel(0, 0)).toBe(3);
      expect(engine.getCellFadeLevel(4, 4)).toBe(4);

      // Generation 4
      engine.updateGeneration();
      engine.updateFadeGrid(fadeDuration);
      expect(engine.getCellFadeLevel(0, 0)).toBe(2);
      expect(engine.getCellFadeLevel(4, 4)).toBe(3);
    });
  });

  describe('getCellFadeLevel', () => {
    it('returns fade level for valid cell', () => {
      engine.fadeGrid[2][3] = 7;
      expect(engine.getCellFadeLevel(2, 3)).toBe(7);
    });

    it('returns 0 for out of bounds cell', () => {
      expect(engine.getCellFadeLevel(-1, 0)).toBe(0);
      expect(engine.getCellFadeLevel(0, -1)).toBe(0);
      expect(engine.getCellFadeLevel(100, 0)).toBe(0);
      expect(engine.getCellFadeLevel(0, 100)).toBe(0);
    });
  });

  describe('clearStateTracking', () => {
    it('clears fade grid', () => {
      engine.fadeGrid[2][2] = 5;
      engine.fadeGrid[3][3] = 3;

      engine.clearStateTracking();

      expect(engine.getCellFadeLevel(2, 2)).toBe(0);
      expect(engine.getCellFadeLevel(3, 3)).toBe(0);
    });
  });

  describe('getGridSnapshot / restoreFromSnapshot', () => {
    it('preserves fade grid in snapshot', () => {
      engine.fadeGrid[1][1] = 4;
      engine.fadeGrid[2][2] = 2;

      const snapshot = engine.getGridSnapshot();

      expect(snapshot.fadeGrid[1][1]).toBe(4);
      expect(snapshot.fadeGrid[2][2]).toBe(2);
    });

    it('restores fade grid from snapshot', () => {
      const snapshot = engine.getGridSnapshot();
      snapshot.fadeGrid[3][3] = 7;

      engine.restoreFromSnapshot(snapshot);

      expect(engine.getCellFadeLevel(3, 3)).toBe(7);
    });
  });
});
