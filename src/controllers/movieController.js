/*
  Monta o layout e conecta links internos ao histórico do navegador.
  Esta etapa ainda não consulta filmes; as demais telas entram depois.
 */
import home from '../pages/Home.html?raw';
import notFound from '../pages/NotFound.html?raw';
import { resolveRoute } from '../routers/routes.js';

export function mountApplication(root) {
  const main = root.querySelector('#main');
  function render() {
    const route = resolveRoute(location);
    main.innerHTML = route.name === 'home' ? home : notFound;
    root.querySelectorAll('nav a').forEach(link => {
      link.classList.toggle('active', link.pathname === location.pathname);
    });
  }
  function onClick(event) {
    const link = event.target.closest('a[data-route]');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey
      || event.shiftKey || event.altKey) return;
    event.preventDefault();
    history.pushState(null, '', link.href);
    render();
    main.focus();
  }
  root.addEventListener('click', onClick);
  window.addEventListener('popstate', render);
  render();
  return () => {
    root.removeEventListener('click', onClick);
    window.removeEventListener('popstate', render);
  };
}
