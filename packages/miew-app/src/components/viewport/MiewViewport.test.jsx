import React from 'react';
import { render, screen, act } from '@testing-library/react';
import MiewViewport from './MiewViewport.jsx';
import { useMiew } from '../../contexts/MiewContext';

let miewReactViewerProps;

jest.mock('miew-react', () => {
  const MockMiewReactViewer = (props) => {
    miewReactViewerProps = props;
    return <div data-testid="mock-viewer" />;
  };

  return MockMiewReactViewer;
});

function createMockMiew() {
  const handlers = {};
  const settingHandlers = {};

  return {
    logger: { level: 'info' },
    addEventListener: jest.fn((name, callback) => {
      handlers[name] = callback;
    }),
    removeEventListener: jest.fn((name, callback) => {
      if (handlers[name] === callback) {
        delete handlers[name];
      }
    }),
    settings: {
      addEventListener: jest.fn((name, callback) => {
        settingHandlers[name] = callback;
      }),
      removeEventListener: jest.fn((name, callback) => {
        if (settingHandlers[name] === callback) {
          delete settingHandlers[name];
        }
      }),
    },
    run: jest.fn(),
    halt: jest.fn(),
    emit(name, event = {}) {
      if (handlers[name]) {
        handlers[name](event);
      }
    },
    emitSetting(name, event = {}) {
      if (settingHandlers[name]) {
        settingHandlers[name](event);
      }
    },
  };
}

const MiewConsumer = () => {
  const miew = useMiew();
  return <div>{miew ? 'miew-ready' : 'miew-missing'}</div>;
};

describe('<MiewViewport>', () => {
  beforeEach(() => {
    miewReactViewerProps = undefined;
    window.miew = null;
    jest.clearAllMocks();
  });

  it('passes miew-react wrapper props and default options', () => {
    const onChange = jest.fn();
    const updateLoadingStage = jest.fn();

    render(<MiewViewport onChange={onChange} updateLoadingStage={updateLoadingStage} />);

    expect(screen.getByTestId('mock-viewer')).toBeDefined();
    expect(miewReactViewerProps.className).toBe('miew-container');
    expect(miewReactViewerProps.options).toEqual({
      load: '1crn',
      settings: { axes: false, fps: false },
    });
    expect(typeof miewReactViewerProps.onInit).toBe('function');
    expect(typeof miewReactViewerProps.onError).toBe('function');
  });

  it('initializes Miew instance, updates context and forwards loading events', () => {
    const onChange = jest.fn();
    const updateLoadingStage = jest.fn();
    const mockMiew = createMockMiew();

    render(
      <MiewViewport onChange={onChange} updateLoadingStage={updateLoadingStage}>
        <MiewConsumer />
      </MiewViewport>,
    );

    expect(screen.getByText('miew-missing')).toBeDefined();

    act(() => {
      miewReactViewerProps.onInit(mockMiew);
    });

    expect(window.miew).toBe(mockMiew);
    expect(mockMiew.logger.level).toBe('debug');
    expect(onChange).toHaveBeenCalledWith({ viewer: mockMiew });
    expect(screen.getByText('miew-ready')).toBeDefined();

    act(() => {
      mockMiew.emit('fetching');
      mockMiew.emit('parsing');
      mockMiew.emit('rebuilding');
      mockMiew.emit('titleChanged', { data: 'My Molecule' });
      mockMiew.emitSetting('change:axes', { changed: 'axes' });
      mockMiew.emitSetting('change:autoRotation', { changed: 'autoRotation' });
    });

    expect(updateLoadingStage).toHaveBeenCalledWith('Fetching...');
    expect(updateLoadingStage).toHaveBeenCalledWith('Parsing...');
    expect(updateLoadingStage).toHaveBeenCalledWith('Building geometry...');
    expect(updateLoadingStage).toHaveBeenCalledWith('My Molecule');
    expect(onChange).toHaveBeenCalledWith({ prefs: { changed: 'axes' } });
    expect(onChange).toHaveBeenCalledWith({ prefs: { changed: 'autoRotation' } });
  });

  it('handles init errors from miew-react wrapper', () => {
    const onChange = jest.fn();
    const updateLoadingStage = jest.fn();

    render(<MiewViewport onChange={onChange} updateLoadingStage={updateLoadingStage} />);

    act(() => {
      miewReactViewerProps.onError(new Error('init failed'));
    });

    expect(updateLoadingStage).toHaveBeenCalledWith('Failed to initialize viewer');
  });

  it('halts and runs Miew instance according to frozen prop changes', () => {
    const onChange = jest.fn();
    const updateLoadingStage = jest.fn();
    const mockMiew = createMockMiew();

    const { rerender } = render(
      <MiewViewport onChange={onChange} updateLoadingStage={updateLoadingStage} frozen={false} />,
    );

    act(() => {
      miewReactViewerProps.onInit(mockMiew);
    });

    expect(mockMiew.run).toHaveBeenCalledTimes(1);
    expect(mockMiew.halt).toHaveBeenCalledTimes(0);

    rerender(<MiewViewport onChange={onChange} updateLoadingStage={updateLoadingStage} frozen />);
    expect(mockMiew.halt).toHaveBeenCalledTimes(1);

    rerender(<MiewViewport onChange={onChange} updateLoadingStage={updateLoadingStage} frozen={false} />);
    expect(mockMiew.run).toHaveBeenCalledTimes(2);
  });

  it('cleans up global Miew instance and notifies consumers on unmount', () => {
    const onChange = jest.fn();
    const updateLoadingStage = jest.fn();
    const mockMiew = createMockMiew();

    const { unmount } = render(
      <MiewViewport onChange={onChange} updateLoadingStage={updateLoadingStage} />,
    );

    act(() => {
      miewReactViewerProps.onInit(mockMiew);
    });

    onChange.mockClear();
    unmount();

    expect(window.miew).toBeNull();
    expect(onChange).toHaveBeenCalledWith({ viewer: null });
    expect(mockMiew.removeEventListener).toHaveBeenCalledWith('fetching', expect.any(Function));
    expect(mockMiew.removeEventListener).toHaveBeenCalledWith('parsing', expect.any(Function));
    expect(mockMiew.removeEventListener).toHaveBeenCalledWith('rebuilding', expect.any(Function));
    expect(mockMiew.removeEventListener).toHaveBeenCalledWith('titleChanged', expect.any(Function));
    expect(mockMiew.settings.removeEventListener).toHaveBeenCalledWith('change:axes', expect.any(Function));
    expect(mockMiew.settings.removeEventListener).toHaveBeenCalledWith('change:autoRotation', expect.any(Function));
  });
});
