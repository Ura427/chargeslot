export function App() {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-4">
          <img src="/favicon.svg" alt="" className="size-7" />
          <span className="text-lg font-semibold tracking-tight">
            ChargeSlot
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Reserve an EV charger
        </h1>
        <p className="mt-3 max-w-prose text-slate-600">
          Pick a station, book a free 30-minute slot, and check in when you
          arrive.
        </p>
      </main>
    </div>
  );
}
