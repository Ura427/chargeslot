import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { store } from './app/store';

describe('App shell', () => {
  it('shows the brand and sends unauthenticated visitors to the login page', () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('ChargeSlot');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Log in' }),
    ).toBeInTheDocument();
  });
});
