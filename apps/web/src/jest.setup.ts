import '@testing-library/jest-dom';

// Polyfill TextEncoder for React Router compatibility
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = class {
    encode(input: string) {
      return new Uint8Array(Buffer.from(input));
    }
  };
}

// Mock console.error to avoid unnecessary noise in test output
global.console.error = jest.fn();
