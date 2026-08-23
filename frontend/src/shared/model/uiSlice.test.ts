import { describe, it, expect } from 'vitest';
import {
  uiReducer,
  modalOpened,
  modalClosed,
  selectIsAnyModalOpen,
} from './uiSlice';

describe('uiSlice', () => {
  describe('reducer', () => {
    it('returns the initial state', () => {
      expect(uiReducer(undefined, { type: '@@INIT' })).toEqual({
        openModalsCount: 0,
      });
    });

    it('increments openModalsCount on modalOpened', () => {
      const state = uiReducer({ openModalsCount: 0 }, modalOpened());
      expect(state.openModalsCount).toBe(1);
    });

    it('increments openModalsCount for each modalOpened call', () => {
      let state = uiReducer({ openModalsCount: 0 }, modalOpened());
      state = uiReducer(state, modalOpened());
      state = uiReducer(state, modalOpened());
      expect(state.openModalsCount).toBe(3);
    });

    it('decrements openModalsCount on modalClosed', () => {
      const state = uiReducer({ openModalsCount: 2 }, modalClosed());
      expect(state.openModalsCount).toBe(1);
    });

    it('never lets openModalsCount go below zero', () => {
      const state = uiReducer({ openModalsCount: 0 }, modalClosed());
      expect(state.openModalsCount).toBe(0);
    });
  });

  describe('selectIsAnyModalOpen', () => {
    it('returns false when no modals are open', () => {
      const state = { ui: { openModalsCount: 0 } };
      expect(selectIsAnyModalOpen(state as never)).toBe(false);
    });

    it('returns true when at least one modal is open', () => {
      const state = { ui: { openModalsCount: 1 } };
      expect(selectIsAnyModalOpen(state as never)).toBe(true);
    });
  });
});
