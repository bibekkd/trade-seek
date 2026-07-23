"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="app-shell">
      <section className="top-band" aria-labelledby="route-error-heading">
        <div>
          <p className="eyebrow">Route Error</p>
          <h1 id="route-error-heading">Could not load this workspace</h1>
          <p className="lede">
            The app hit a recoverable runtime error while loading this page.
          </p>
        </div>
        <button className="approve-button" type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
