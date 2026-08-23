import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProviders } from './AppProviders';

describe('AppProviders', () => {
  it('renders its children', () => {
    render(
      <AppProviders>
        <div>child content</div>
      </AppProviders>,
    );

    expect(screen.getByText('child content')).toBeInTheDocument();
  });
});
