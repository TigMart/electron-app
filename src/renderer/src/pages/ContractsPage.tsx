export default function ContractsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="min-h-screen flex-1 rounded-xl bg-muted/50 p-6 md:min-h-min">
        <h3 className="mb-4 text-2xl font-bold">Contracts</h3>
        <p className="text-muted-foreground">
          Manage your documents here. This page will display all your files and folders.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-4 hover:bg-accent">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  📄
                </div>
                <div>
                  <h4 className="font-medium">Document {i}</h4>
                  <p className="text-sm text-muted-foreground">Sample file</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
