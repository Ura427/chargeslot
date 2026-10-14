import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { makeStore } from './app/store';
import { restoreSession } from './api/auth.api';

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function renderApp(handler: (url: string) => Response) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
      Promise.resolve(handler(new Request(input, init).url)),
    ),
  );
  const store = makeStore();
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    </Provider>,
  );
  await restoreSession(store);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App shell', () => {
  it('sends a visitor without a session to the login page', async () => {
    await renderApp(() => json(401, {}));

    expect(screen.getByRole('banner')).toHaveTextContent('ChargeSlot');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Log in' }),
    ).toBeInTheDocument();
  });

  it('restores the session after a reload using the refresh cookie', async () => {
    await renderApp((url) =>
      url.endsWith('/auth/refresh')
        ? json(201, { accessToken: 'restored' })
        : json(200, []),
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Book a charger' }),
    ).toBeInTheDocument();
  });
});
