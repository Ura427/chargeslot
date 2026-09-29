import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App shell', () => {
  it('shows the brand in the header and the page heading', () => {
    render(<App />);

    expect(screen.getByRole('banner')).toHaveTextContent('ChargeSlot');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Reserve an EV charger' }),
    ).toBeInTheDocument();
  });
});
