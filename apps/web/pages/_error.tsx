import type { NextPageContext } from "next";

type ErrorFallbackProps = {
  statusCode?: number;
};

export default function ErrorFallback({ statusCode }: ErrorFallbackProps) {
  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <p style={styles.eyebrow}>Application Error</p>
        <h1 style={styles.heading}>Could not load this page</h1>
        <p style={styles.copy}>
          {statusCode
            ? `The server returned status ${statusCode}.`
            : "The app hit a client-side loading error."}
        </p>
      </section>
    </main>
  );
}

ErrorFallback.getInitialProps = ({ res, err }: NextPageContext): ErrorFallbackProps => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#070b12",
    color: "#e5edf7",
    display: "grid",
    placeItems: "center",
    padding: 24,
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  panel: {
    width: "min(560px, 100%)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    background: "#111827",
    padding: 28,
  },
  eyebrow: {
    margin: "0 0 10px",
    color: "#2dd4bf",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.09em",
    textTransform: "uppercase" as const,
  },
  heading: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.1,
  },
  copy: {
    margin: "14px 0 0",
    color: "#94a3b8",
    lineHeight: 1.6,
  },
};
