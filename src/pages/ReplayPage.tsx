export function ReplayPage() {
  return (
    <div className="h-screen bg-background text-foreground dark">
      <div className="mx-auto flex h-full max-w-5xl flex-col justify-center gap-6 px-6 py-12">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Replay
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Replay sessions and recorded runs
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            This page is ready for replay-specific controls and visualizations.
            The existing microscope control view now lives on the index route.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card/70 p-6 shadow-sm backdrop-blur-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-medium">Next steps</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Add replay transport hooks or playback state.</li>
              <li>Render recorded frames, metadata, or task timelines.</li>
              <li>Keep navigation available to jump back to the live index view.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
