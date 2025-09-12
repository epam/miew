import React from 'react';
import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, cleanup } from '@testing-library/react';
import Viewer from './Viewer';

// Mock console.warn to test deprecation warnings
const originalWarn = console.warn;
let mockWarn;

beforeEach(() => {
  mockWarn = jest.fn();
  console.warn = mockWarn;
});

afterEach(() => {
  console.warn = originalWarn;
  cleanup();
});

describe('Viewer', () => {
  it('renders "Viewer" text', () => {
    render(<Viewer />);
    expect(screen.getByText('Viewer')).toBeDefined();
  });

  describe('onInit callback', () => {
    it('calls onInit with Miew instance when initialization succeeds', () => {
      const onInitMock = jest.fn();
      render(<Viewer onInit={onInitMock} />);

      expect(onInitMock).toHaveBeenCalledTimes(1);
      expect(onInitMock.mock.calls[0][0]).toMatchObject({
        init: expect.any(Function),
        term: expect.any(Function),
        run: expect.any(Function),
        load: expect.any(Function),
      });
    });

    it('does not call onInit when it is not a function', () => {
      // Should not throw error when onInit is not provided or not a function
      expect(() => {
        render(<Viewer onInit="not-a-function" />);
      }).not.toThrow();

      expect(() => {
        render(<Viewer onInit={null} />);
      }).not.toThrow();

      expect(() => {
        render(<Viewer />);
      }).not.toThrow();
    });
  });

  describe('onError callback', () => {
    it('calls onError when Miew.init() fails', () => {
      const onErrorMock = jest.fn();
      const options = { __test__shouldInitFail: true };

      render(<Viewer onError={onErrorMock} options={options} />);

      expect(onErrorMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(onErrorMock.mock.calls[0][0].message).toBe('Failed to initialize Miew');
    });

    it('calls onError when Miew constructor throws an exception', () => {
      const onErrorMock = jest.fn();
      const options = {
        __test__shouldMiewThrow: true,
        __test__miewThrowErrorMessage: 'Constructor failed',
      };

      render(<Viewer onError={onErrorMock} options={options} />);

      expect(onErrorMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(onErrorMock.mock.calls[0][0].message).toBe('Constructor failed');
    });

    it('calls onError when Miew.init() throws an exception', () => {
      const onErrorMock = jest.fn();
      const options = {
        __test__shouldInitThrow: true,
        __test__initThrowErrorMessage: 'Init method threw an error',
      };

      render(<Viewer onError={onErrorMock} options={options} />);

      expect(onErrorMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(onErrorMock.mock.calls[0][0].message).toBe('Init method threw an error');
    });

    it('does not call onError when it is not a function', () => {
      const options = { __test__shouldInitFail: true };

      // Should not throw error when onError is not provided or not a function
      expect(() => {
        render(<Viewer onError="not-a-function" options={options} />);
      }).not.toThrow();

      expect(() => {
        render(<Viewer onError={null} options={options} />);
      }).not.toThrow();
    });

    it('does not call onInit when initialization fails', () => {
      const onInitMock = jest.fn();
      const onErrorMock = jest.fn();
      const options = { __test__shouldInitFail: true };

      render(<Viewer onInit={onInitMock} onError={onErrorMock} options={options} />);

      expect(onInitMock).not.toHaveBeenCalled();
      expect(onErrorMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('theme prop deprecation', () => {
    it('shows deprecation warning when theme prop is provided', () => {
      render(<Viewer theme="some-theme" />);

      expect(mockWarn).toHaveBeenCalledTimes(1);
      expect(mockWarn).toHaveBeenCalledWith(
        'Warning: The "theme" prop is deprecated and will be removed in future versions of miew-react. It is kept for backwards compatibility only.',
      );
    });

    it('does not show warning when theme prop is not provided', () => {
      render(<Viewer />);

      expect(mockWarn).not.toHaveBeenCalled();
    });

    it('does not show warning when theme prop is undefined', () => {
      render(<Viewer theme={undefined} />);

      expect(mockWarn).not.toHaveBeenCalled();
    });

    it('shows warning when theme prop is null (considered defined)', () => {
      render(<Viewer theme={null} />);

      expect(mockWarn).toHaveBeenCalledTimes(1);
    });
  });

  describe('options handling', () => {
    it('merges default settings with provided options', () => {
      const onInitMock = jest.fn();
      const customOptions = {
        settings: { customSetting: true, axes: true },
        otherOption: 'value',
      };

      render(<Viewer onInit={onInitMock} options={customOptions} />);

      expect(onInitMock).toHaveBeenCalledTimes(1);
      const miewInstance = onInitMock.mock.calls[0][0];
      expect(miewInstance.options).toMatchObject({
        settings: {
          axes: true,
          fps: false,
          customSetting: true,
        },
        otherOption: 'value',
        container: expect.any(HTMLElement),
      });
    });

    it('works with comprehensive options object matching PropTypes shape', () => {
      const onInitMock = jest.fn();
      const comprehensiveOptions = {
        load: '1CRN',
        type: 'pdb',
        settings: {
          axes: true,
          fps: true,
          autoRotation: 0.1,
          bg: { color: 0x000000 },
        },
        settingsCookie: 'customSettings',
        cookiePath: '/custom/',
        reps: [
          { mode: 'LC', colorer: 'EL' },
          { selector: 'chain A', mode: 'CS' },
        ],
      };

      render(<Viewer onInit={onInitMock} options={comprehensiveOptions} />);

      expect(onInitMock).toHaveBeenCalledTimes(1);
      const miewInstance = onInitMock.mock.calls[0][0];
      expect(miewInstance.options).toMatchObject({
        load: '1CRN',
        type: 'pdb',
        settings: {
          axes: true,
          fps: true,
          autoRotation: 0.1,
          bg: { color: 0x000000 },
        },
        settingsCookie: 'customSettings',
        cookiePath: '/custom/',
        reps: [
          { mode: 'LC', colorer: 'EL' },
          { selector: 'chain A', mode: 'CS' },
        ],
        container: expect.any(HTMLElement),
      });
    });

    it('works with no options provided', () => {
      const onInitMock = jest.fn();

      render(<Viewer onInit={onInitMock} />);

      expect(onInitMock).toHaveBeenCalledTimes(1);
      const miewInstance = onInitMock.mock.calls[0][0];
      expect(miewInstance.options).toMatchObject({
        settings: {
          axes: false,
          fps: false,
        },
        container: expect.any(HTMLElement),
      });
    });
  });

  describe('component lifecycle', () => {
    it('creates Miew instance only once', () => {
      const onInitMock = jest.fn();
      const { rerender } = render(<Viewer onInit={onInitMock} />);

      expect(onInitMock).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<Viewer onInit={onInitMock} />);

      // Should not create new instance
      expect(onInitMock).toHaveBeenCalledTimes(1);
    });

    it('creates new Miew instance when options change', () => {
      const onInitMock = jest.fn();
      const { rerender } = render(<Viewer onInit={onInitMock} options={{ load: 'molecule1' }} />);

      expect(onInitMock).toHaveBeenCalledTimes(1);

      // Re-render with different options
      rerender(<Viewer onInit={onInitMock} options={{ load: 'molecule2' }} />);

      // Should create new instance
      expect(onInitMock).toHaveBeenCalledTimes(2);
    });

    it('properly cleans up Miew instance when component unmounts', () => {
      const onInitMock = jest.fn();
      const { unmount } = render(<Viewer onInit={onInitMock} />);

      expect(onInitMock).toHaveBeenCalledTimes(1);
      const miewInstance = onInitMock.mock.calls[0][0];
      const termSpy = jest.spyOn(miewInstance, 'term');

      // Unmount the component
      unmount();

      // Should call term() for cleanup
      expect(termSpy).toHaveBeenCalledTimes(1);
    });
  });
});
