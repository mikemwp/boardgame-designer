import '@testing-library/jest-dom';
import { vi } from 'vitest';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  })) as typeof window.matchMedia;
}

vi.mock('spin-wheel', () => ({
  Wheel: class {
    image: unknown = null;
    constructor(el: HTMLElement) {
      if (el?.dataset) el.dataset.wheelMounted = 'true';
    }
    spinToItem() {}
    remove() {}
  },
}));
