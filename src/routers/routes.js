// Reconhece apenas as telas implementadas nesta etapa.
export function resolveRoute(location) {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(location.search);
  const page = Math.min(500, Math.max(1, parseInt(params.get('pagina'), 10) || 1));
  if (path === '/') return { name: 'home', page };
  
  
  return { name: 'notFound' };
}
