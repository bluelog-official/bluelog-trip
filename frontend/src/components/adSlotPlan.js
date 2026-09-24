const CONCLUSION_PATTERN = /결론|conclusion|마무리/i;
const FAQ_PATTERN = /faq|자주\s*묻는|q\s*&\s*a/i;

function isH2(line) {
  const trimmed = line.trim();
  return trimmed.startsWith("## ") && !trimmed.startsWith("###");
}

export function planAdSlots(markdown) {
  const h2s = [];
  const h2LineIndexes = [];
  let tableCount = 0;
  let inTable = false;
  let firstTableEndLineIndex = null;

  String(markdown || "")
    .split(/\r?\n/)
    .forEach((line, lineIndex) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("|")) {
        if (!inTable) {
          tableCount += 1;
          inTable = true;
        }
        if (tableCount === 1) {
          firstTableEndLineIndex = lineIndex;
        }
      } else {
        inTable = false;
      }
      if (isH2(line)) {
        h2s.push(trimmed.replace(/^##\s+/, ""));
        h2LineIndexes.push(lineIndex);
      }
    });

  const reviewIndexes = [];
  h2s.forEach((title, index) => {
    if (FAQ_PATTERN.test(title) || CONCLUSION_PATTERN.test(title)) {
      reviewIndexes.push(index + 1);
    }
  });

  let inArticle = null;
  if (tableCount > 0) {
    inArticle = { type: "table", index: 1 };
  } else if (h2s.length >= 2) {
    inArticle = { type: "h2", index: 2 };
  }

  return {
    displayBeforeFirstH2: h2s.length > 0,
    inArticle,
    multiplexAfterH2: reviewIndexes.length ? Math.max(...reviewIndexes) : null,
    h2Count: h2s.length,
    h2LineIndexes,
    firstTableEndLineIndex,
  };
}

export function readGuideApproved(guide) {
  if (!guide || typeof guide !== "object") return false;
  if (typeof guide.is_approved === "boolean") return guide.is_approved;
  return guide.qa_result?.is_approved === true;
}

export function visibleAdSlots(markdown, approved) {
  if (!approved) {
    return [];
  }
  const plan = planAdSlots(markdown);
  const slots = [];
  if (plan.displayBeforeFirstH2) {
    slots.push("display");
  }
  if (plan.inArticle) {
    slots.push("in-article");
  }
  slots.push("multiplex");
  return slots;
}

function addBefore(inserts, lineIndex, slot) {
  const bucket = inserts.get(lineIndex) ?? [];
  bucket.push(slot);
  inserts.set(lineIndex, bucket);
}

export function buildArticleBlocks(markdown, approved) {
  const source = String(markdown ?? "");
  if (!approved) {
    return source ? [{ kind: "markdown", text: source }] : [];
  }

  const plan = planAdSlots(source);
  const lines = source.split(/\r?\n/);
  const inserts = new Map();
  const trailing = [];

  if (plan.displayBeforeFirstH2 && plan.h2LineIndexes.length > 0) {
    addBefore(inserts, plan.h2LineIndexes[0], "display");
  }

  if (plan.inArticle?.type === "table" && plan.firstTableEndLineIndex != null) {
    addBefore(inserts, plan.firstTableEndLineIndex + 1, "in_article");
  } else if (plan.inArticle?.type === "h2" && plan.h2LineIndexes.length >= 2) {
    addBefore(inserts, plan.h2LineIndexes[1] + 1, "in_article");
  }

  trailing.push("multiplex");

  const blocks = [];
  let buffer = [];
  const flush = () => {
    if (!buffer.length) return;
    const text = buffer.join("\n");
    buffer = [];
    if (text.trim()) {
      blocks.push({ kind: "markdown", text });
    }
  };

  for (let index = 0; index <= lines.length; index += 1) {
    const slots = inserts.get(index);
    if (slots?.length) {
      flush();
      slots.forEach((slot) => blocks.push({ kind: "ad", slot }));
    }
    if (index < lines.length) {
      buffer.push(lines[index]);
    }
  }
  flush();
  trailing.forEach((slot) => blocks.push({ kind: "ad", slot }));
  return blocks;
}
