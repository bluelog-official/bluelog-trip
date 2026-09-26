export default function NotFound({ onNavigate }) {
  const goHome = (event) => {
    event.preventDefault();
    onNavigate("/");
    window.scrollTo({ top: 0 });
  };

  return (
    <article className="policy-page not-found-page">
      <p className="policy-kicker">404</p>
      <h1>Page not found</h1>
      <p>That address is not a BlueLog Trip guide or policy page.</p>
      <a className="not-found-home" href="/" onClick={goHome}>
        Back to the homepage
      </a>
    </article>
  );
}
