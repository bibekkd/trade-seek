"use client";

import "./globals.css";

type GlobalErrorPageProps = {
  reset: () => void;
};

export default function GlobalErrorPage({ reset }: GlobalErrorPageProps) {
  return (
    <html lang="en">
      <body>
        <main className="app-shell">
          <section className="top-band" aria-labelledby="global-error-heading">
            <div>
              <p className="eyebrow">Application Error</p>
              <h1 id="global-error-heading">The app needs a refresh</h1>
              <p className="lede">
                A required page component failed to load. Retry once the dev server
                has finished compiling.
              </p>
            </div>
            <button className="approve-button" type="button" onClick={reset}>
              Retry
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
