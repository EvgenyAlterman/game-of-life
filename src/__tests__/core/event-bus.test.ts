import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '../../core/event-bus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  describe('on / emit', () => {
    it('fires handler when event is emitted', () => {
      const handler = vi.fn();
      bus.on('simulation:start', handler);
      bus.emit('simulation:start');
      expect(handler).toHaveBeenCalledOnce();
    });

    it('passes payload to handler', () => {
      const handler = vi.fn();
      bus.on('simulation:tick', handler);
      bus.emit('simulation:tick', { generation: 5, population: 42 });
      expect(handler).toHaveBeenCalledWith({ generation: 5, population: 42 });
    });

    it('supports multiple handlers for same event', () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      bus.on('canvas:needsRedraw', h1);
      bus.on('canvas:needsRedraw', h2);
      bus.emit('canvas:needsRedraw');
      expect(h1).toHaveBeenCalledOnce();
      expect(h2).toHaveBeenCalledOnce();
    });

    it('does not fire handlers for different events', () => {
      const handler = vi.fn();
      bus.on('simulation:start', handler);
      bus.emit('simulation:stop');
      expect(handler).not.toHaveBeenCalled();
    });

    it('handles emit with no registered handlers', () => {
      expect(() => bus.emit('simulation:start')).not.toThrow();
    });
  });

  describe('off', () => {
    it('removes a specific handler', () => {
      const handler = vi.fn();
      bus.on('simulation:start', handler);
      bus.off('simulation:start', handler);
      bus.emit('simulation:start');
      expect(handler).not.toHaveBeenCalled();
    });

    it('does not affect other handlers', () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      bus.on('simulation:start', h1);
      bus.on('simulation:start', h2);
      bus.off('simulation:start', h1);
      bus.emit('simulation:start');
      expect(h1).not.toHaveBeenCalled();
      expect(h2).toHaveBeenCalledOnce();
    });

    it('is safe to call for non-registered handler', () => {
      const handler = vi.fn();
      expect(() => bus.off('simulation:start', handler)).not.toThrow();
    });
  });

  describe('unsubscribe (return value of on)', () => {
    it('removes the handler when called', () => {
      const handler = vi.fn();
      const unsub = bus.on('simulation:start', handler);
      unsub();
      bus.emit('simulation:start');
      expect(handler).not.toHaveBeenCalled();
    });

    it('is safe to call multiple times', () => {
      const handler = vi.fn();
      const unsub = bus.on('simulation:start', handler);
      unsub();
      unsub();
      bus.emit('simulation:start');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('fires handler only once', () => {
      const handler = vi.fn();
      bus.once('simulation:start', handler);
      bus.emit('simulation:start');
      bus.emit('simulation:start');
      expect(handler).toHaveBeenCalledOnce();
    });

    it('passes payload correctly', () => {
      const handler = vi.fn();
      bus.once('simulation:tick', handler);
      bus.emit('simulation:tick', { generation: 1, population: 10 });
      expect(handler).toHaveBeenCalledWith({ generation: 1, population: 10 });
    });

    it('returns unsubscribe that prevents firing', () => {
      const handler = vi.fn();
      const unsub = bus.once('simulation:start', handler);
      unsub();
      bus.emit('simulation:start');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('removes all handlers for all events', () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      bus.on('simulation:start', h1);
      bus.on('simulation:stop', h2);
      bus.destroy();
      bus.emit('simulation:start');
      bus.emit('simulation:stop');
      expect(h1).not.toHaveBeenCalled();
      expect(h2).not.toHaveBeenCalled();
    });

    it('allows new subscriptions after destroy', () => {
      bus.destroy();
      const handler = vi.fn();
      bus.on('simulation:start', handler);
      bus.emit('simulation:start');
      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe('arbitrary events', () => {
    it('supports custom string events', () => {
      const handler = vi.fn();
      bus.on('custom:myEvent' as any, handler);
      bus.emit('custom:myEvent' as any, { data: 'test' });
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });
  });
});
