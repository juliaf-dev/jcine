const BASE = 'https://api.themoviedb.org/3';
// Faz uma consulta autenticada ao TMDB, retornando o JSON ou lançando um erro.
export async function request(path, params = {}, signal) {
  const key = import.meta.env.VITE_TMDB_API_KEY;
  if (!key)
    throw new Error(
      'Chave VITE_TMDB_API_KEY não configurada',
    );
  const url = new URL(`${BASE}${path}`);
  url.search = new URLSearchParams({
    api_key: key,
    language: 'pt-BR', //solicita a versão em português
    ...params,
  });
  let response;
  try {
    response = await fetch(url, {
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
        : AbortSignal.timeout(20000), // espera no máximo 20 segundos antes de abortar a requisição
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar ao TMDB');
  }
  if (!response.ok) {
    if (response.status === 401)
      throw new Error('A chave da API não foi aceita');
    if (response.status === 404) throw new Error('Filme não encontrado.');
    throw new Error('O TMDB está indisponível no momento. Tente novamente.');
  }
  return response.json();
}
// Valida o caminho recebido e cria a URL do cartaz;
export const imageUrl = (path, size = 'w500') =>
  path && /^\/[a-zA-Z0-9._-]+$/.test(path)
    ? `https://image.tmdb.org/t/p/${size}${path}`
    : '';
// Extrai e formata nota e ano da data de lançamento
export const movieYear = (movie) =>
  movie.release_date?.slice(0, 4) || 'Ano não informado';
export const movieRating = (movie) =>
  movie.vote_average > 0
    ? Number(movie.vote_average).toFixed(1).replace('.', ',')
    : '—';
