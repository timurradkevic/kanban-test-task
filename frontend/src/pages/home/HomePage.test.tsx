import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    );

    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
