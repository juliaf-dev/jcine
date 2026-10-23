import { imageUrl, movieRating, movieYear } from '../utils/tmdb.js';

export function mountCarousel(hero, movies) {
  const featured = movies.filter((movie) => movie.backdrop_path).slice(0, 5);
  if (!featured.length) return () => {};

  const events = new AbortController();
  const options = { signal: events.signal };
  const image = hero.querySelector('.hero-backdrop');
  const title = hero.querySelector('#hero-title');
  const description = hero.querySelector('.hero-description');
  const link = hero.querySelector('.hero-link');
  const synopsis = hero.querySelector('[data-hero-synopsis]');
  const controls = hero.querySelector('.carousel-controls');
  const indicators = hero.querySelector('.carousel-indicators-list');
  let index = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let hovered = false;
  let focused = false;
  let touchStart;

  function showSlide(nextIndex) {
    index = (nextIndex + featured.length) % featured.length;
    const movie = featured[index];
    image.hidden = false;
    image.src = imageUrl(movie.backdrop_path, 'w1280');
    title.textContent = movie.title;
    description.textContent = `★ ${movieRating(movie)} · ${movieYear(movie)}`;
    const overview = movie.overview?.trim();
    // Encurta por palavras para não deixar a sinopse terminar no meio de um nome.
    const excerpt = overview && overview.length > 170
      ? overview.slice(0, 170).replace(/\s+\S*$/, '').trimEnd()
      : overview;
    synopsis.textContent = excerpt || 'Conheça os detalhes desta história.';
    synopsis.parentElement.hidden = false;
    link.href = `/filme/${movie.id}`;
    link.setAttribute('aria-label', `Saiba mais sobre ${movie.title}`);
    indicators.querySelectorAll('button').forEach((button, position) => {
      button.setAttribute('aria-current', String(position === index));
    });
  }

  featured.forEach((movie, position) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Ver destaque: ${movie.title}`);
    button.addEventListener('click', () => showSlide(position), options);
    indicators.append(button);
  });
  image.addEventListener('error', () => { image.hidden = true; }, options);
  hero.addEventListener('mouseenter', () => { hovered = true; }, options);
  hero.addEventListener('mouseleave', () => { hovered = false; }, options);
  hero.addEventListener('focusin', () => { focused = true; }, options);
  hero.addEventListener('focusout', (event) => {
    focused = hero.contains(event.relatedTarget);
  }, options);
  hero.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    showSlide(index + (event.key === 'ArrowRight' ? 1 : -1));
  }, options);
  hero.addEventListener('touchstart', (event) => {
    touchStart = event.touches[0];
  }, { ...options, passive: true });
  hero.addEventListener('touchend', (event) => {
    if (!touchStart) return;
    const end = event.changedTouches[0];
    const dx = end.clientX - touchStart.clientX;
    const dy = end.clientY - touchStart.clientY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      showSlide(index + (dx < 0 ? 1 : -1));
    }
    touchStart = null;
  }, { ...options, passive: true });

  controls.hidden = featured.length < 2;
  showSlide(0);
  const timer = window.setInterval(() => {
    if (!reducedMotion.matches && !hovered && !focused && !document.hidden) {
      showSlide(index + 1);
    }
  }, 7000);

  return () => {
    window.clearInterval(timer);
    events.abort();
  };
}
