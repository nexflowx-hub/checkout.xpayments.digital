export default function CheckoutRouteLoading() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(15,23,42,.05),transparent_38%),linear-gradient(180deg,#fff,#fafafa)] text-foreground">
      <header className="border-b border-border/20 bg-background/90">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-xl bg-muted" />
            <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="h-7 w-20 animate-pulse rounded-full bg-muted" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl space-y-3.5 px-4 py-5 sm:px-6 sm:py-7">
        <div className="rounded-[26px] border border-border/25 bg-card/85 p-5">
          <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
          <div className="mx-auto mt-6 h-10 w-44 animate-pulse rounded-lg bg-muted" />
          <div className="mx-auto mt-3 h-3 w-28 animate-pulse rounded-md bg-muted" />
        </div>

        <div className="rounded-[26px] border border-border/25 bg-card/85 p-5">
          <div className="h-4 w-36 animate-pulse rounded-md bg-muted" />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>

        <div className="rounded-[26px] border border-border/25 bg-card/85 p-5">
          <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="h-28 animate-pulse rounded-[20px] bg-muted" />
            <div className="h-28 animate-pulse rounded-[20px] bg-muted" />
          </div>
        </div>
      </main>
    </div>
  );
}
