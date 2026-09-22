export default function Homepage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 p-10 text-center">
      <h1 className="text-4xl font-bold">Home</h1>
      <p className="text-muted-foreground max-w-md">
        Welcome to the dashboard. Use the sidebar to navigate.
      </p>
    </section>
  )
}