import { readFilters } from '../utils/searchFilters.js';

// Remove barras finais para reconhecer sempre como a mesma rota.
function normalizePath(path) {
  return path.replace(/\/+$/, '') || '/';
}

export function resolveRoute(location) {
  const path = normalizePath(location.pathname);
  const params = new URLSearchParams(location.search);
  const page = Math.min(
    500,
    Math.max(1, Number.parseInt(params.get('pagina'), 10) || 1),
  );
  if (path === '/') return { name: 'home', page };
  if (path === '/busca')
    return {
      name: 'search',
      query: (params.get('q') || '').trim().slice(0, 150),
      page,
      filters: readFilters(params),
    };

  const match = path.match(/^\/filme\/(\d+)$/);
  if (match) return { name: 'details', id: match[1] };
  return { name: 'notFound' };// Caminhos desconhecidos viram notFound.
}
