import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { Provider } from 'react-redux';
import { store } from '@/app/store';

describe('HomePage', () => {
  it('renders without crashing', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      </Provider>,
    );

    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
