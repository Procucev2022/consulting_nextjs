import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
  __esModule: true
}));

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Line: (props: any) => {
    if (props.options?.plugins?.tooltip?.callbacks?.label) {
      props.options.plugins.tooltip.callbacks.label({ dataset: { label: 'Test' }, parsed: { y: 100 } });
    }
    if (props.options?.scales?.y?.ticks?.callback) {
      props.options.scales.y.ticks.callback(105);
    }
    return React.createElement('div', { 'data-testid': 'mock-line-chart' }, 'Line Chart');
  },
  Bar: () => React.createElement('div', { 'data-testid': 'mock-bar-chart' }, 'Bar Chart')
}));

// Mock chart.js
vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn()
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  PointElement: vi.fn(),
  LineElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
  Filler: vi.fn()
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// Mock window.scrollTo
window.scrollTo = vi.fn();
