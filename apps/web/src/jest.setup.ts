import '@testing-library/jest-dom';

// Polyfill TextEncoder for React Router compatibility
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = class {
    encode(input: string) {
      return new Uint8Array(Buffer.from(input));
    }
    get encoding() {
      return 'utf-8';
    }
    encodeInto(input: string, output: Uint8Array) {
      const buffer = Buffer.from(input);
      const copied = Math.min(buffer.length, output.length);
      buffer.copy(output, 0, 0, copied);
      return {
        read: copied,
        written: copied
      };
    }
  } as unknown as typeof TextEncoder;
}

// Mock console.error to avoid unnecessary noise in test output
global.console.error = jest.fn();
