import React from 'react';
import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, cleanup } from '@testing-library/react';
import Miew from 'miew';
import Viewer from './Viewer';

// Use the existing mock and make it a Jest spy
jest.mock('miew', () => {
  const OriginalMock = jest.requireActual('../__mocks__/miew.js').default;
  return jest.fn().mockImplementation((...args) => new OriginalMock(...args));
});

// Mock console.warn to test deprecation warnings
const originalWarn = console.warn;
let mockWarn;

beforeEach(() => {
  mockWarn = jest.fn();
  console.warn = mockWarn;

  // Clear all mocks including the Miew constructor spy
  jest.clearAllMocks();
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

      expect(Miew).toHaveBeenCalledTimes(1);
      expect(onInitMock).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<Viewer onInit={onInitMock} />);

      // Should not create new Miew instance
      expect(Miew).toHaveBeenCalledTimes(1);
      expect(onInitMock).toHaveBeenCalledTimes(1);
    });

    it('creates new Miew instance when options change', () => {
      const onInitMock = jest.fn();
      const { rerender } = render(<Viewer onInit={onInitMock} options={{ load: 'molecule1' }} />);

      expect(Miew).toHaveBeenCalledTimes(1);
      expect(onInitMock).toHaveBeenCalledTimes(1);

      // Re-render with different options
      rerender(<Viewer onInit={onInitMock} options={{ load: 'molecule2' }} />);

      // Should create new Miew instance
      expect(Miew).toHaveBeenCalledTimes(2);
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

  describe('options stability', () => {
    it('does not recreate Miew instance for equivalent inline options objects', () => {
      const { rerender } = render(<Viewer options={{ load: '1crn' }} />);

      expect(Miew).toHaveBeenCalledTimes(1);

      // Re-render with new object but same content
      rerender(<Viewer options={{ load: '1crn' }} />);

      // Should not create new Miew instance because content is equivalent
      expect(Miew).toHaveBeenCalledTimes(1);
    });

    it('does not recreate Miew instance for equivalent complex nested options', () => {
      const complexOptions = {
        load: '1crn',
        settings: { axes: true, fps: false },
        reps: [{ mode: 'LC' }],
      };

      const { rerender } = render(<Viewer options={complexOptions} />);

      expect(Miew).toHaveBeenCalledTimes(1);

      // Re-render with new object but equivalent nested content
      rerender(
        <Viewer
          options={{
            load: '1crn',
            settings: { axes: true, fps: false },
            reps: [{ mode: 'LC' }],
          }}
        />,
      );

      // Should not create new Miew instance because deep content is equivalent
      expect(Miew).toHaveBeenCalledTimes(1);
    });

    it('creates new Miew instance only when options content actually changes', () => {
      const { rerender } = render(<Viewer options={{ load: '1crn', settings: { axes: false } }} />);

      expect(Miew).toHaveBeenCalledTimes(1);

      // Re-render with same content - should not recreate
      rerender(<Viewer options={{ load: '1crn', settings: { axes: false } }} />);
      expect(Miew).toHaveBeenCalledTimes(1);

      // Re-render with different content - should recreate
      rerender(<Viewer options={{ load: '1crn', settings: { axes: true } }} />);
      expect(Miew).toHaveBeenCalledTimes(2);
    });

    it('handles options with undefined/null values correctly', () => {
      const { rerender } = render(<Viewer options={{ load: '1crn', type: null }} />);

      expect(Miew).toHaveBeenCalledTimes(1);

      // Re-render with equivalent options including null values
      rerender(<Viewer options={{ load: '1crn', type: null }} />);

      // Should not recreate Miew instance
      expect(Miew).toHaveBeenCalledTimes(1);
    });

    it('handles options with circular references gracefully', () => {
      // Create options with circular reference that would break JSON.stringify
      const circularOptions = { load: '1crn' };
      circularOptions.self = circularOptions;

      const { rerender } = render(<Viewer options={circularOptions} />);

      expect(Miew).toHaveBeenCalledTimes(1);

      // Create another circular reference - should recreate because equality check fails safely
      const anotherCircularOptions = { load: '1crn' };
      anotherCircularOptions.self = anotherCircularOptions;

      rerender(<Viewer options={anotherCircularOptions} />);

      // Should recreate Miew because areOptionsEqual fails safely for circular references
      expect(Miew).toHaveBeenCalledTimes(2);
    });
  });

  describe('callback stability', () => {
    it('does not recreate Miew instance when callbacks change but options remain the same', () => {
      const onInitMock1 = jest.fn();
      const onInitMock2 = jest.fn();
      const onErrorMock1 = jest.fn();
      const onErrorMock2 = jest.fn();

      const { rerender } = render(
        <Viewer onInit={onInitMock1} onError={onErrorMock1} options={{ load: '1crn' }} />,
      );

      expect(Miew).toHaveBeenCalledTimes(1);
      expect(onInitMock1).toHaveBeenCalledTimes(1);

      // Re-render with different callbacks but same options
      rerender(<Viewer onInit={onInitMock2} onError={onErrorMock2} options={{ load: '1crn' }} />);

      // Should not create new Miew instance
      expect(Miew).toHaveBeenCalledTimes(1);
      expect(onInitMock2).toHaveBeenCalledTimes(0);
    });

    it('uses latest callbacks even when Miew instance is not recreated', () => {
      const onInitMock = jest.fn();
      const onErrorMock1 = jest.fn();
      const onErrorMock2 = jest.fn();

      const { rerender } = render(
        <Viewer onInit={onInitMock} onError={onErrorMock1} options={{ load: '1crn' }} />,
      );

      expect(Miew).toHaveBeenCalledTimes(1);
      expect(onInitMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock1).toHaveBeenCalledTimes(0);
      expect(onErrorMock2).toHaveBeenCalledTimes(0);

      // Re-render with different onError callback but same options
      rerender(<Viewer onInit={onInitMock} onError={onErrorMock2} options={{ load: '1crn' }} />);

      // Should not create new Miew instance
      expect(Miew).toHaveBeenCalledTimes(1);
      expect(onInitMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock1).toHaveBeenCalledTimes(0);
      expect(onErrorMock2).toHaveBeenCalledTimes(0);

      // Re-render with options that will cause an error to test latest callback usage
      rerender(
        <Viewer
          onInit={onInitMock}
          onError={onErrorMock2}
          options={{ load: '1crn', __test__shouldInitFail: true }}
        />,
      );

      // Should recreate and use the latest onError callback (onErrorMock2)
      expect(Miew).toHaveBeenCalledTimes(2);
      expect(onInitMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock1).toHaveBeenCalledTimes(0);
      expect(onErrorMock2).toHaveBeenCalledTimes(1);
    });

    it('handles inline callback functions without unnecessary re-initialization', () => {
      const onInitMock = jest.fn();
      let capturedViewer = null;

      const { rerender } = render(
        <Viewer
          options={{ load: '1crn' }}
          onInit={(viewer) => {
            onInitMock();
            capturedViewer = viewer;
          }}
        />,
      );

      expect(Miew).toHaveBeenCalledTimes(1);
      expect(onInitMock).toHaveBeenCalledTimes(1);
      expect(capturedViewer).not.toBeNull();
      const firstViewer = capturedViewer;

      // Re-render with new inline callback - should not recreate Miew
      rerender(
        <Viewer
          options={{ load: '1crn' }}
          onInit={(viewer) => {
            onInitMock();
            capturedViewer = viewer;
          }}
        />,
      );

      // Should not have created new Miew instance
      expect(Miew).toHaveBeenCalledTimes(1);
      expect(onInitMock).toHaveBeenCalledTimes(1); // Still called only once
      expect(capturedViewer).toBe(firstViewer);
    });
  });

  describe('mixed stability scenarios', () => {
    it('handles simultaneous callback and options changes correctly', () => {
      const onInitMock1 = jest.fn();
      const onInitMock2 = jest.fn();

      const { rerender } = render(<Viewer onInit={onInitMock1} options={{ load: '1crn' }} />);

      expect(Miew).toHaveBeenCalledTimes(1);
      expect(onInitMock1).toHaveBeenCalledTimes(1);

      // Change both callbacks and options - should recreate and use new callback
      rerender(<Viewer onInit={onInitMock2} options={{ load: '2abc' }} />);

      expect(Miew).toHaveBeenCalledTimes(2);
      expect(onInitMock1).toHaveBeenCalledTimes(1);
      expect(onInitMock2).toHaveBeenCalledTimes(1);
    });

    it('maintains callback stability across multiple re-renders', () => {
      const onInitMock = jest.fn();
      let renderCount = 0;

      const TestComponent = () => {
        renderCount++;
        return <Viewer options={{ load: '1crn' }} onInit={() => onInitMock(renderCount)} />;
      };

      const { rerender } = render(<TestComponent />);
      expect(Miew).toHaveBeenCalledTimes(1);
      expect(onInitMock).toHaveBeenCalledTimes(1);
      expect(onInitMock).toHaveBeenLastCalledWith(1);

      // Multiple re-renders should not recreate Miew
      rerender(<TestComponent />);
      rerender(<TestComponent />);
      rerender(<TestComponent />);

      // Miew should only be instantiated once, despite 4 renders
      expect(Miew).toHaveBeenCalledTimes(1);
      expect(onInitMock).toHaveBeenCalledTimes(1);
      expect(renderCount).toBe(4);
    });
  });
});
