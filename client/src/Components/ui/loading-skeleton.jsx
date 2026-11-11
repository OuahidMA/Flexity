import { Ripple } from "@/components/ripple";

/**
 * Loading fallback shown while a lazily loaded route chunk is fetching.
 *
 * Displays the app's Ripple loading effect on the dark canvas so there is no
 * flash or layout shift between the loader and the rendered route. Only
 * rendered inside `<Suspense>` boundaries, never on initial page load.
 *
 * @returns {JSX.Element} The loading ripple.
 */
export function LoadingSkeleton() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-canvas text-primary">
      <div className="animate-pulse">
        <Ripple className="size-14" />
      </div>
    </div>
  );
}
