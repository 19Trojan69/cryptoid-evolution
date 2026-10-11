import { useEffect, useRef, useState, type ReactNode } from "react";
import { axiosClient } from "../lib/axiosClient";
import { useLocale } from "../i18n";

type Result = { fields: string[]; translated: boolean; locale: string };
export default function CommunityText({
  postId,
  replyId,
  fields,
  hidden,
  children,
}: {
  postId: string;
  replyId?: string;
  fields: string[];
  hidden?: boolean;
  children: (texts: string[]) => ReactNode;
}) {
  const { locale, t } = useLocale();
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => typeof window !== "undefined" && !("IntersectionObserver" in window)),
    [originalKey, setOriginalKey] = useState<string | null>(null);
  const [result, setResult] = useState<(Result & { key: string }) | null>(null),
    [failedKey, setFailedKey] = useState<string | null>(null);
  const contentKey = JSON.stringify(fields);
  const requestKey = JSON.stringify([postId, replyId, locale, contentKey, hidden]);
  const current = result?.key === requestKey ? result : null;
  const original = originalKey === requestKey;
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { root: element.closest("dialog"), rootMargin: "100px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const texts: string[] = JSON.parse(contentKey);
    if (!visible || hidden || !texts.some(text => text.trim())) return;
    const controller = new AbortController();
    axiosClient
      .get<Result>(`/feedback/posts/${postId}/translation`, {
        params: { locale, ...(replyId ? { reply: replyId } : {}) },
        signal: controller.signal,
        timeout: 35_000,
      })
      .then(({ data }) => {
        if (!controller.signal.aborted && data.locale === locale && data.fields.length === texts.length)
          setResult({ ...data, key: requestKey });
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailedKey(requestKey);
      });
    return () => controller.abort();
    // Stable content identity avoids requests on parent re-renders.
  }, [visible, hidden, postId, replyId, locale, contentKey, requestKey]);
  return (
    <div ref={container} className="community-text" lang={current?.translated && !original ? locale : undefined}>
      {children(current?.translated && !original ? current.fields : fields)}
      {current?.translated && (
        <div className="community-translation">
          <small>{t("Automatically translated")}</small>
          <button type="button" onClick={() => setOriginalKey(original ? null : requestKey)}>
            {t(original ? "Show translation" : "Show original")}
          </button>
        </div>
      )}
      {failedKey === requestKey && !current && (
        <small className="community-translation-unavailable">{t("Translation unavailable. Original shown.")}</small>
      )}
    </div>
  );
}
