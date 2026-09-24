const STORAGE_KEY = "bluelog.community.posts.v1";

export const PLATFORM_TABS = [
  { id: "all", label: "All" },
  { id: "reddit", label: "Reddit" },
  { id: "quora", label: "Quora" },
  { id: "pinterest", label: "Pinterest" },
  { id: "tip", label: "Guide Tips" },
];

export const PLATFORM_LABELS = {
  reddit: "Reddit",
  quora: "Quora",
  pinterest: "Pinterest",
  tip: "Guide Tip",
};

const SEED_POSTS = [
  {
    id: "seed-reddit-kyoto",
    title: "r/JapanTravel night-bus note cleared 1.2k upvotes",
    platform: "reddit",
    author: "BlueLog Desk",
    metric: "1.2k upvotes",
    body: "The Kyoto guide's last-train timing was posted as a first-person note, not a promo. The guide link sat in the second paragraph after the station name. Most clicks came from a comment that asked for the map, so the next draft should lead with the concrete time.",
    createdAt: "2026-09-22T09:30:00.000Z",
  },
  {
    id: "seed-quora-paris",
    title: "Quora answer on a 3-day Paris plan kept sending readers to the Louvre section",
    platform: "quora",
    author: "BlueLog Desk",
    metric: "640 views",
    body: "The question was whether three days is enough. The answer used the guide's day-by-day split and named ticket prices before the link. Readers who wanted the Mona Lisa line tip opened the full guide.",
    createdAt: "2026-09-21T14:10:00.000Z",
  },
  {
    id: "seed-pinterest-bali",
    title: "Ubud rice-terrace pin passed 8.6k saves",
    platform: "pinterest",
    author: "BlueLog Desk",
    metric: "8.6k saves",
    body: "The pin used the terrace photo already in the Bali guide, with alt text that names Ubud. The board is 'Island Food & Temples'. Description stays under two sentences and ends on the guide path.",
    createdAt: "2026-09-20T08:00:00.000Z",
  },
  {
    id: "seed-tip-table",
    title: "Put the local price table above the first food heading",
    platform: "tip",
    author: "BlueLog Desk",
    metric: "",
    body: "Guides that open the meal section with a price table hold readers longer than guides that start with a scenery paragraph. Keep three rows: dish, place, and a local price. That block is also the easiest piece to reuse in a Quora answer.",
    createdAt: "2026-09-19T11:20:00.000Z",
  },
];

function readStoredPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.warn("community posts unreadable:", err);
    return null;
  }
}

export function loadCommunityPosts() {
  const stored = readStoredPosts();
  if (stored) return stored;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_POSTS));
  } catch (err) {
    console.warn("community posts not saved:", err);
  }
  return SEED_POSTS;
}

export function saveCommunityPosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function latestViralLogs(posts, limit = 5) {
  return [...posts]
    .filter((post) => post.platform !== "tip")
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, limit);
}

export function formatPostDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
