import type { RankedSource } from "@/types/search";
import type { FindOriginResult } from "@/types/find-origin";
import styles from "./FindOriginApp.module.css";

type Props = {
  sources: RankedSource[];
};

export function ResultsList({ sources }: Props) {
  if (sources.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Не удалось найти надёжные источники.</p>
      </div>
    );
  }

  return (
    <ul className={styles.results}>
      {sources.map((source, index) => (
        <li key={source.url} className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <span className={styles.resultIndex}>{index + 1}</span>
            <span className={styles.confidence}>{source.confidence}%</span>
          </div>
          <a
            href={source.url}
            className={styles.resultTitle}
            target="_blank"
            rel="noopener noreferrer"
          >
            {source.title}
          </a>
          <p className={styles.resultReason}>{source.reason}</p>
          <p className={styles.resultUrl}>{source.url}</p>
        </li>
      ))}
    </ul>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className={styles.error} role="alert">
      {message}
    </div>
  );
}

export type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: Extract<FindOriginResult, { ok: true }> }
  | { status: "error"; message: string };
