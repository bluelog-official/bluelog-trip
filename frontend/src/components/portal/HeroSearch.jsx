import { Search } from "lucide-react";

export default function HeroSearch({ query, onQueryChange, onSearch }) {
  return (
    <section className="hero">
      <p className="hero-kicker">Global travel desk</p>
      <h1 className="hero-title">Find Local Travel & Food Guides</h1>
      <p className="hero-copy">
        City routes, neighborhood meals, and guides that passed QA before they go live.
      </p>
      <form className="hero-search" onSubmit={onSearch}>
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Try Paris, ramen, Bali…"
          aria-label="Find Local Travel & Food Guides"
        />
        <button type="submit">Search</button>
      </form>
    </section>
  );
}

const INTROS = {
  all: {
    kicker: "Destinations",
    title: "All regions",
    text: "City guides across Asia, Europe, and the Americas.",
  },
  asia: {
    kicker: "Destinations",
    title: "Asia",
    text: "Temples, islands, night markets, and the meals around them.",
  },
  europe: {
    kicker: "Destinations",
    title: "Europe",
    text: "City breaks, museum timing, and neighborhood tables.",
  },
  americas: {
    kicker: "Destinations",
    title: "Americas",
    text: "Coast-to-coast walks and the local plates along the way.",
  },
  food: {
    kicker: "Local Food",
    title: "Eat with the neighborhood",
    text: "Named stalls, budget meals, and the prices guides actually list.",
  },
};

export function CategoryIntro({ category }) {
  const intro = INTROS[category];
  if (!intro) return null;
  return (
    <section className="category-intro">
      <p className="hero-kicker">{intro.kicker}</p>
      <h1 className="category-title">{intro.title}</h1>
      <p className="category-copy">{intro.text}</p>
    </section>
  );
}
