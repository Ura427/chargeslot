import { makeStore } from '../app/store';
import { setCredentials } from '../features/auth/authSlice';
import { baseQueryWithReauth } from './baseQueryWithReauth';

type Handler = (req: Request) => Response | Promise<Response>;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function setup(handler: Handler) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(handler(new Request(input, init))),
  );
  vi.stubGlobal('fetch', fetchMock);
  const store = makeStore();
  store.dispatch(
    setCredentials({ accessToken: 'old', user: { email: 'a@b.c' } }),
  );
  const call = (url: string) =>
    baseQueryWithReauth(
      url,
      {
        dispatch: store.dispatch,
        getState: store.getState,
        signal: new AbortController().signal,
        abort: () => {},
        extra: undefined,
        endpoint: 'test',
        type: 'query',
      },
      {},
    );
  const urls = () =>
    fetchMock.mock.calls.map(
      ([input]) => new URL(new Request(input).url).pathname,
    );
  return { store, call, urls };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('baseQueryWithReauth', () => {
  it('refreshes on a 401 and retries the request with the new token', async () => {
    const { store, call, urls } = setup((req) => {
      if (req.url.endsWith('/auth/refresh'))
        return json(201, { accessToken: 'new' });
      return req.headers.get('Authorization') === 'Bearer new'
        ? json(200, { ok: true })
        : json(401, { message: 'expired' });
    });

    const result = await call('/reservations/me');

    expect(result.data).toEqual({ ok: true });
    expect(store.getState().auth.accessToken).toBe('new');
    expect(urls()).toEqual([
      '/reservations/me',
      '/auth/refresh',
      '/reservations/me',
    ]);
  });

  it('shares one refresh between requests that fail at the same time', async () => {
    const { call, urls } = setup(async (req) => {
      if (req.url.endsWith('/auth/refresh')) {
        await new Promise((r) => setTimeout(r, 10));
        return json(201, { accessToken: 'new' });
      }
      return req.headers.get('Authorization') === 'Bearer new'
        ? json(200, {})
        : json(401, {});
    });

    const results = await Promise.all([call('/a'), call('/b'), call('/c')]);

    expect(results.every((r) => !r.error)).toBe(true);
    expect(urls().filter((u) => u === '/auth/refresh')).toHaveLength(1);
  });

  it('logs out when the refresh itself fails', async () => {
    const { store, call } = setup(() => json(401, {}));

    const result = await call('/reservations/me');

    expect(result.error).toMatchObject({ status: 401 });
    expect(store.getState().auth.accessToken).toBeNull();
  });

  it('does not refresh when a login attempt is rejected', async () => {
    const { call, urls } = setup(() =>
      json(401, { message: 'Invalid credentials' }),
    );

    await call('/auth/login');

    expect(urls()).toEqual(['/auth/login']);
  });
});
