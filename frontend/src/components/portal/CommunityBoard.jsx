import { useEffect, useState } from "react";
import { PLATFORM_LABELS, PLATFORM_TABS, formatPostDate } from "../../lib/communityStore";
import { uiCopy } from "../../lib/localeCopy";

const EMPTY_DRAFT = {
  author: "",
  platform: "reddit",
  title: "",
  metric: "",
  body: "",
};

export default function CommunityBoard({ posts, query, onCreate, language }) {
  const copy = uiCopy(language);
  const [tab, setTab] = useState("all");
  const [openId, setOpenId] = useState("");
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!id) return;
    setOpenId(id);
    setTab("all");
    window.requestAnimationFrame(() => {
      document.getElementById(`post-${id}`)?.scrollIntoView({ block: "center" });
    });
  }, []);

  const needle = query.trim().toLowerCase();
  const visible = posts.filter((post) => {
    if (tab !== "all" && post.platform !== tab) return false;
    if (!needle) return true;
    return `${post.title} ${post.body} ${post.author} ${post.metric}`.toLowerCase().includes(needle);
  });

  const updateDraft = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.body.trim()) {
      setFormError("Title and note are required.");
      return;
    }
    const post = onCreate({
      author: draft.author.trim() || "Traveler",
      platform: draft.platform,
      title: draft.title.trim(),
      metric: draft.metric.trim(),
      body: draft.body.trim(),
    });
    setDraft(EMPTY_DRAFT);
    setFormError("");
    setTab(post.platform);
    setOpenId(post.id);
  };

  return (
    <section className="board">
      <header className="board-header">
        <p className="hero-kicker">Community & Viral Log</p>
        <h1>{copy.communityTitle}</h1>
        <p className="board-lead">
          Share a Reddit, Quora, or Pinterest result, or leave a tip for the next guide.
        </p>
      </header>

      <div className="board-tabs" role="tablist" aria-label="Viral log categories">
        {PLATFORM_TABS.map((item) => {
          const count = item.id === "all"
            ? posts.length
            : posts.filter((post) => post.platform === item.id).length;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={tab === item.id ? "board-tab active" : "board-tab"}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="board-layout">
        <form className="composer" onSubmit={handleSubmit}>
          <h2>Write a log</h2>
          <label>
            Name
            <input
              value={draft.author}
              onChange={updateDraft("author")}
              placeholder="Traveler"
            />
          </label>
          <label>
            Channel
            <select value={draft.platform} onChange={updateDraft("platform")}>
              <option value="reddit">Reddit performance</option>
              <option value="quora">Quora performance</option>
              <option value="pinterest">Pinterest performance</option>
              <option value="tip">Guide tip</option>
            </select>
          </label>
          <label>
            Title
            <input
              value={draft.title}
              onChange={updateDraft("title")}
              placeholder="What worked"
            />
          </label>
          <label>
            Result
            <input
              value={draft.metric}
              onChange={updateDraft("metric")}
              placeholder="1.2k upvotes, optional"
            />
          </label>
          <label>
            Note
            <textarea
              value={draft.body}
              onChange={updateDraft("body")}
              rows={5}
              placeholder="What you posted, and what the guide should change next time."
            />
          </label>
          {formError ? <p className="form-error">{formError}</p> : null}
          <button type="submit" className="composer-submit">Post to the board</button>
        </form>

        <div className="post-column">
          {visible.length === 0 ? (
            <p className="grid-empty">No logs on this tab yet.</p>
          ) : (
            <ul className="post-list">
              {visible.map((post) => {
                const open = openId === post.id;
                return (
                  <li key={post.id} id={`post-${post.id}`}>
                    <article className={open ? "post-card open" : "post-card"}>
                      <button
                        type="button"
                        className="post-toggle"
                        aria-expanded={open}
                        onClick={() => setOpenId(open ? "" : post.id)}
                      >
                        <span className={`platform-pill ${post.platform}`}>
                          {PLATFORM_LABELS[post.platform] || post.platform}
                        </span>
                        <h3>{post.title}</h3>
                        <small>
                          {post.author}
                          {post.metric ? ` · ${post.metric}` : ""}
                          {` · ${formatPostDate(post.createdAt)}`}
                        </small>
                      </button>
                      {open ? <p className="post-body">{post.body}</p> : null}
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
