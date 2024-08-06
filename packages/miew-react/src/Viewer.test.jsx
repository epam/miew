import React from 'react';
import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import Viewer from './Viewer';

describe('Viewer', () => {
  it('renders "Viewer" text', () => {
    render(<Viewer />);
    expect(screen.getByText('Viewer')).toBeDefined();
  });
});
