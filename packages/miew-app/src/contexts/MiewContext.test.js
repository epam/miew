import React from 'react';
import { render, screen } from '@testing-library/react';
import { MiewProvider, useMiew } from './MiewContext';

// Test component that uses the useMiew hook
const TestComponent = () => {
  const viewer = useMiew();

  if (!viewer) {
    return <div>No viewer</div>;
  }

  return <div>Viewer available: {viewer.id}</div>;
};

describe('MiewContext', () => {
  describe('useMiew hook', () => {
    it('returns null when used outside of MiewProvider', () => {
      render(<TestComponent />);

      expect(screen.getByText('No viewer')).toBeDefined();
    });

    it('returns the viewer instance when used inside MiewProvider', () => {
      const mockViewer = { id: 'test-viewer-123' };

      render(
        <MiewProvider viewer={mockViewer}>
          <TestComponent />
        </MiewProvider>,
      );

      expect(screen.getByText('Viewer available: test-viewer-123')).toBeDefined();
    });

    it('handles viewer with complex object structure', () => {
      const mockViewer = {
        id: 'complex-viewer',
        VERSION: '1.0.0',
        settings: { axes: true },
        _complexVisual: { getComplex: jest.fn() },
        getVisuals: jest.fn(() => ['visual1', 'visual2']),
        rep: jest.fn(),
        halt: jest.fn(),
        run: jest.fn(),
      };

      const ComplexTestComponent = () => {
        const viewer = useMiew();
        return (
          <div>
            <div>ID: {viewer?.id}</div>
            <div>Axes: {String(viewer?.settings?.axes)}</div>
            <div>Visuals: {viewer?.getVisuals()?.join(', ')}</div>
          </div>
        );
      };

      render(
        <MiewProvider viewer={mockViewer}>
          <ComplexTestComponent />
        </MiewProvider>,
      );

      expect(screen.getByText('ID: complex-viewer')).toBeDefined();
      expect(screen.getByText('Axes: true')).toBeDefined();
      expect(screen.getByText('Visuals: visual1, visual2')).toBeDefined();
      expect(mockViewer.getVisuals).toHaveBeenCalled();
    });

    it('handles viewer becoming available after a delay', () => {
      const ComponentWithEarlyReturn = () => {
        const viewer = useMiew();

        if (!viewer) {
          return <div>Loading viewer...</div>;
        }

        return <div>Viewer loaded</div>;
      };

      const { rerender } = render(
        <MiewProvider viewer={null}>
          <ComponentWithEarlyReturn />
        </MiewProvider>,
      );

      expect(screen.getByText('Loading viewer...')).toBeDefined();

      // Simulate viewer becoming available
      const mockViewer = { id: 'new-viewer' };
      rerender(
        <MiewProvider viewer={mockViewer}>
          <ComponentWithEarlyReturn />
        </MiewProvider>,
      );

      expect(screen.getByText('Viewer loaded')).toBeDefined();
    });
  });
});
