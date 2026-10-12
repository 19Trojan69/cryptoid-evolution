import { useEffect, useRef, useState } from "react";
import { useLocale } from "../i18n";
export default function FeedbackDescription({ text }: { text: string }) {
  const { t } = useLocale();
  const paragraph = useRef<HTMLParagraphElement>(null);
  const [expandedText, setExpandedText] = useState<string | null>(null),
    [truncated, setTruncated] = useState(false);
  const expanded = expandedText === text;
  useEffect(() => {
    const element = paragraph.current;
    if (!element || expanded) return;
    const measure = () => setTruncated(element.scrollHeight > element.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text, expanded]);
  return (
    <>
      <p ref={paragraph} className={`feedback-description${expanded ? "" : " feedback-description-preview"}`}>
        {text}
      </p>
      {(truncated || expanded) && (
        <button
          className="feedback-expand"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpandedText(expanded ? null : text)}
        >
          {t(expanded ? "Show less" : "Read more")}
        </button>
      )}
    </>
  );
}
