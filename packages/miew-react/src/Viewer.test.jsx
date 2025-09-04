import React from 'react';
import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import Viewer from './Viewer';

// Mock the Miew constructor and its methods
const mockMiew = {
  init: jest.fn().mockReturnValue(false),
  run: jest.fn(),
  term: jest.fn(),
};

jest.mock('miew', () => {
  return jest.fn().mockImplementation(() => mockMiew);
});

// Mock console.error to suppress error messages in tests
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe('Viewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock to default behavior
    mockMiew.init.mockReturnValue(false);
  });

  it('renders with proper accessibility attributes', () => {
    render(<Viewer />);
    const viewer = screen.getByRole('application');
    expect(viewer).toBeDefined();
    expect(viewer.getAttribute('aria-label')).toBe('3D Molecular Viewer');
  });

  it('handles initialization failure gracefully', async () => {
    render(<Viewer />);
    const viewer = screen.getByRole('application');

    // After initialization fails, should not be busy
    await waitFor(() => {
      expect(viewer.getAttribute('aria-busy')).toBe('false');
    });
  });

  it('accepts custom className prop', () => {
    const customClass = 'custom-viewer-class';
    render(<Viewer className={customClass} />);
    const viewer = screen.getByRole('application');
    expect(viewer.className).toContain(customClass);
  });

  it('calls onError callback when initialization fails', async () => {
    const onErrorMock = jest.fn();
    render(<Viewer onError={onErrorMock} />);

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalled();
      expect(onErrorMock).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('calls onInit callback when initialization succeeds', async () => {
    // Mock successful initialization
    mockMiew.init.mockReturnValue(true);

    const onInitMock = jest.fn();
    render(<Viewer onInit={onInitMock} />);

    await waitFor(() => {
      expect(onInitMock).toHaveBeenCalled();
      expect(onInitMock).toHaveBeenCalledWith(mockMiew);
    });
  });
});
