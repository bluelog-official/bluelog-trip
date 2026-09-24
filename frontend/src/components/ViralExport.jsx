import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { uiCopy } from "../lib/localeCopy";

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch (err) {
    console.warn("clipboard.writeText failed:", err);
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  if (!copied) {
    throw new Error("copy failed");
  }
}

function CopyButton({ text, copyLabel, copiedLabel }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <button type="button" className="copy-btn" onClick={handleCopy}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? copiedLabel : copyLabel}
    </button>
  );
}

function ExportCard({ title, meta, text, copyLabel, copiedLabel }) {
  if (!text) return null;
  return (
    <section className="export-card">
      <header className="export-card-header">
        <div>
          <h3>{title}</h3>
          {meta ? <p className="export-meta">{meta}</p> : null}
        </div>
        <CopyButton text={text} copyLabel={copyLabel} copiedLabel={copiedLabel} />
      </header>
      <pre className="export-body">{text}</pre>
    </section>
  );
}

function blockText(parts) {
  return parts.filter(Boolean).join("\n\n");
}

export default function ViralExport({ syndication, language }) {
  const copy = uiCopy(language);
  const data = syndication || {};
  const reddit = data.reddit || {};
  const quora = data.quora || {};
  const pinterest = data.pinterest || {};
  const backlink = data.backlink || {};
  const teasers = Array.isArray(data.social_teasers) ? data.social_teasers : [];
  const hashtags = Array.isArray(data.platform_hashtags) ? data.platform_hashtags : [];

  const cards = [
    {
      title: "Reddit",
      meta: reddit.subreddit ? `r/${reddit.subreddit}` : "",
      text: blockText([reddit.title, reddit.body]),
    },
    {
      title: "Quora",
      meta: "",
      text: blockText([quora.question, quora.answer]),
    },
    {
      title: "Pinterest",
      meta: pinterest.board || "",
      text: blockText([
        pinterest.pin_title,
        pinterest.description,
        pinterest.image_alt ? `alt: ${pinterest.image_alt}` : "",
      ]),
    },
    {
      title: "Backlink",
      meta: backlink.target_path || "",
      text: blockText([
        backlink.anchor_text,
        backlink.target_path,
        backlink.outreach_note,
      ]),
    },
    {
      title: "Social teasers",
      meta: "",
      text: teasers.join("\n"),
    },
    {
      title: "Hashtags",
      meta: "",
      text: hashtags.join(" "),
    },
  ].filter((card) => card.text);

  if (cards.length === 0) {
    return (
      <div className="viral-empty">{copy.viralEmptyDetail}</div>
    );
  }

  return (
    <div className="viral-export">
      {cards.map((card) => (
        <ExportCard
          key={card.title}
          {...card}
          copyLabel={copy.copy}
          copiedLabel={copy.copied}
        />
      ))}
    </div>
  );
}
