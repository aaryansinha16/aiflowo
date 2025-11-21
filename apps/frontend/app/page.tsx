export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-4">
          AI Flowo 🤖
        </h1>
        <p className="text-center text-lg text-muted-foreground">
          Autonomous Web Agent - AI That ACTS
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">🛫 Flight Booking</h2>
            <p className="text-sm text-muted-foreground">
              Search and book flights automatically
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">💼 Job Applications</h2>
            <p className="text-sm text-muted-foreground">
              Apply to jobs with AI-generated cover letters
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">📝 Form Filling</h2>
            <p className="text-sm text-muted-foreground">
              Fill complex forms intelligently
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">📱 Social Media</h2>
            <p className="text-sm text-muted-foreground">
              Post with advanced media editing
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">⏰ Automation</h2>
            <p className="text-sm text-muted-foreground">
              Schedule multi-step workflows
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">📊 Full Logs</h2>
            <p className="text-sm text-muted-foreground">
              Complete audit trail with screenshots
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
