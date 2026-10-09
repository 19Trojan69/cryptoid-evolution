import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "../i18n";
import { axiosClient } from "../lib/axiosClient";
import BlockchainIcon from "../components/BlockchainIcon";

type Category = "rating" | "idea" | "problem";
type Post = {
  id: string;
  category: Category;
  username: string;
  title: string;
  description: string;
  stars?: number;
  status: "open" | "review" | "planned" | "done";
  hidden: boolean;
  createdAt: string;
  up: number;
  down: number;
  ownVote: number;
  replies: { id: string; text: string; username: string; createdAt: string; developer: true }[];
};
const categories: Record<Category, string> = {
  rating: "Rate the game",
  idea: "Suggest an idea",
  problem: "Report a problem",
};
const statuses = { open: "Open", review: "Under review", planned: "Planned", done: "Fixed / implemented" };
export default function FeedbackHub({
  signedIn,
  onSignIn,
  onClose,
}: {
  signedIn: boolean;
  onSignIn: () => void;
  onClose: () => void;
}) {
  const { locale, t } = useLocale(),
    dialog = useRef<HTMLDialogElement>(null);
  const [category, setCategory] = useState<Category>("idea"),
    [sort, setSort] = useState("newest"),
    [page, setPage] = useState(1),
    [refresh, setRefresh] = useState(0),
    [hidden, setHidden] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]),
    [admin, setAdmin] = useState(false),
    [hasMore, setHasMore] = useState(false),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [stars, setStars] = useState(0),
    [replies, setReplies] = useState<Record<string, string>>({});
  useEffect(() => {
    const d = dialog.current,
      previous = document.activeElement as HTMLElement | null;
    d?.showModal();
    return () => {
      d?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  useEffect(() => {
    let active = true;
    axiosClient
      .get<{
        posts: Post[];
        admin: boolean;
        hasMore: boolean;
      }>(`/feedback/posts?category=${category}&sort=${sort}&page=${page}&hidden=${hidden ? "1" : "0"}`)
      .then(
        ({ data }) => {
          if (active) {
            setPosts(data.posts);
            setAdmin(data.admin);
            setHasMore(data.hasMore);
            setLoading(false);
          }
        },
        () => {
          if (active) {
            setLoading(false);
            setPosts([]);
            setHasMore(false);
            setNotice("Feedback unavailable. Please retry.");
          }
        }
      );
    return () => {
      active = false;
    };
  }, [category, sort, page, hidden, refresh, signedIn]);
  const run = async (action: () => Promise<unknown>, success = "Saved") => {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      await action();
      setNotice(success);
      setRefresh(n => n + 1);
    } catch {
      setNotice("Could not save. Please retry.");
    } finally {
      setBusy(false);
    }
  };
  const number = (n: number) => new Intl.NumberFormat(locale).format(n);
  const reload = () => {
    setNotice("");
    setLoading(true);
    setRefresh(n => n + 1);
  };
  const switchCategory = (value: Category) => {
    setCategory(value);
    setPage(1);
    setLoading(true);
    setNotice("");
    setTitle("");
    setDescription("");
  };
  const moderate = (post: Post, patch: { status?: string; hidden?: boolean }) =>
    void run(() => axiosClient.patch(`/feedback/posts/${post.id}/moderate`, patch));
  return createPortal(
    <dialog
      ref={dialog}
      className="feedback-hub metallic-dialog"
      aria-labelledby="feedback-title"
      onCancel={e => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
    >
      <header>
        <h2 id="feedback-title">
          <BlockchainIcon kind="feedback" />
          {t("Feedback & ideas")}
        </h2>
        <button type="button" onClick={onClose} aria-label={t("Close")}>
          ×
        </button>
      </header>
      <div className="feedback-tabs" role="group" aria-label={t("Category")}>
        {(Object.keys(categories) as Category[]).map(key => (
          <button
            type="button"
            key={key}
            disabled={busy}
            aria-pressed={category === key}
            onClick={() => switchCategory(key)}
          >
            {t(categories[key])}
          </button>
        ))}
      </div>
      {!signedIn && (
        <p>
          {t("Sign in with Pi to contribute or vote.")}{" "}
          <button type="button" onClick={onSignIn}>
            {t("Connect Pi")}
          </button>
        </p>
      )}
      <form
        onSubmit={e => {
          e.preventDefault();
          void run(async () => {
            await axiosClient.post("/feedback/posts", {
              category,
              title,
              description,
              ...(category === "rating" ? { stars } : {}),
            });
            setTitle("");
            setDescription("");
          }, "Contribution saved");
        }}
      >
        {category === "rating" ? (
          <>
            <p>
              {t("Stars rate the game. Votes support individual ideas. Your new rating replaces your previous rating.")}
            </p>
            <div className="feedback-stars" role="group" aria-label={t("Stars")}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  type="button"
                  key={n}
                  disabled={!signedIn || busy}
                  aria-label={`${number(n)} ${t("Stars")}`}
                  aria-pressed={stars === n}
                  onClick={() => setStars(n)}
                >
                  {n <= stars ? "★" : "☆"}
                </button>
              ))}
            </div>
          </>
        ) : (
          <label>
            {t("Title")}
            <input
              required
              maxLength={100}
              value={title}
              disabled={!signedIn || busy}
              onChange={e => setTitle(e.target.value)}
            />
          </label>
        )}
        <label>
          {t(category === "rating" ? "Short comment (optional)" : "Description")}
          <textarea
            required={category !== "rating"}
            maxLength={category === "rating" ? 500 : 3000}
            value={description}
            disabled={!signedIn || busy}
            onChange={e => setDescription(e.target.value)}
          />
        </label>
        <button type="submit" disabled={!signedIn || busy || (category === "rating" && stars === 0)}>
          {t(busy ? "Saving…" : "Submit")}
        </button>
      </form>
      {notice && <p role="status">{t(notice)}</p>}
      <div className="feedback-filters">
        <label>
          {t("Sort by")}
          <select
            value={sort}
            disabled={busy}
            onChange={e => {
              setSort(e.target.value);
              setPage(1);
              setLoading(true);
            }}
          >
            <option value="newest">{t("Newest contributions")}</option>
            <option value="support">{t("Most support")}</option>
          </select>
        </label>
        {admin && (
          <label>
            <input
              type="checkbox"
              checked={hidden}
              disabled={busy}
              onChange={e => {
                setHidden(e.target.checked);
                setPage(1);
                setLoading(true);
              }}
            />
            {t("Include moderated contributions")}
          </label>
        )}
        <button type="button" onClick={reload} disabled={busy}>
          {t("Refresh")}
        </button>
      </div>
      {loading ? (
        <p role="status">{t("Loading…")}</p>
      ) : (
        <div className="feedback-posts">
          {posts.length === 0 && <p>{t("No contributions yet.")}</p>}
          {posts.map(post => (
            <article key={post.id} className="feedback-post" data-hidden={post.hidden}>
              <header>
                <div>
                  <h3>{post.category === "rating" ? `${number(post.stars || 0)} / ${number(5)} ★` : post.title}</h3>
                  <small>
                    @{post.username} ·{" "}
                    {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(post.createdAt))}
                  </small>
                </div>
                <span className="feedback-status">
                  {t(
                    post.status === "done"
                      ? post.category === "problem"
                        ? "Fixed"
                        : "Implemented"
                      : statuses[post.status]
                  )}
                </span>
              </header>
              {post.hidden && <p>{t("Moderated contribution")}</p>}
              <p className="feedback-description">{post.description}</p>
              {post.category !== "rating" && (
                <div className="feedback-votes">
                  <button
                    type="button"
                    aria-pressed={post.ownVote === 1}
                    disabled={!signedIn || busy || post.hidden}
                    onClick={() =>
                      void run(() =>
                        axiosClient.put(`/feedback/posts/${post.id}/vote`, { value: post.ownVote === 1 ? 0 : 1 })
                      )
                    }
                  >
                    👍 {t(post.category === "idea" ? "For" : "Affects me too")} · {number(post.up)}
                  </button>
                  {post.category === "idea" && (
                    <button
                      type="button"
                      aria-pressed={post.ownVote === -1}
                      disabled={!signedIn || busy || post.hidden}
                      onClick={() =>
                        void run(() =>
                          axiosClient.put(`/feedback/posts/${post.id}/vote`, { value: post.ownVote === -1 ? 0 : -1 })
                        )
                      }
                    >
                      👎 {t("Against")} · {number(post.down)}
                    </button>
                  )}
                </div>
              )}
              {post.replies.map(reply => (
                <aside className="developer-reply" key={reply.id}>
                  <b>{t("Developer reply")}</b>
                  <small>@{reply.username}</small>
                  <p>{reply.text}</p>
                </aside>
              ))}
              {admin && (
                <section className="feedback-moderation">
                  <label>
                    {t("Status")}
                    <select
                      value={post.status}
                      disabled={busy}
                      onChange={e => moderate(post, { status: e.target.value })}
                    >
                      {Object.entries(statuses).map(([key, label]) => (
                        <option key={key} value={key}>
                          {t(key === "done" ? (post.category === "problem" ? "Fixed" : "Implemented") : label)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" disabled={busy} onClick={() => moderate(post, { hidden: !post.hidden })}>
                    {t(post.hidden ? "Restore contribution" : "Hide contribution")}
                  </button>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      void run(async () => {
                        await axiosClient.post(`/feedback/posts/${post.id}/reply`, { text: replies[post.id] || "" });
                        setReplies(old => ({ ...old, [post.id]: "" }));
                      });
                    }}
                  >
                    <label>
                      {t("Developer reply")}
                      <textarea
                        required
                        maxLength={2000}
                        value={replies[post.id] || ""}
                        disabled={busy}
                        onChange={e => setReplies(old => ({ ...old, [post.id]: e.target.value }))}
                      />
                    </label>
                    <button type="submit" disabled={busy || post.replies.length >= 20}>
                      {t("Reply")}
                    </button>
                  </form>
                </section>
              )}
            </article>
          ))}
        </div>
      )}
      <nav className="feedback-pagination" aria-label={t("Contributions")}>
        <button
          type="button"
          disabled={page === 1 || busy || loading}
          onClick={() => {
            setPage(n => n - 1);
            setLoading(true);
          }}
        >
          {t("Previous")}
        </button>
        <span>{number(page)}</span>
        <button
          type="button"
          disabled={!hasMore || busy || loading}
          onClick={() => {
            setPage(n => n + 1);
            setLoading(true);
          }}
        >
          {t("Next")}
        </button>
      </nav>
      <button type="button" onClick={onClose}>
        {t("Close")}
      </button>
    </dialog>,
    document.body
  );
}
