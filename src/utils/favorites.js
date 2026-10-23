/*
  Mantém a lista de favoritos no navegador usando localStorage.
  getFavorites lê e valida os dados; toggleFavorite adiciona ou remove um filme.
  Só os campos usados pelos cards são salvos. Não existe login ou banco remoto.
  Ao trocar de navegador ou limpar seus dados, esta lista não é preservada.
 */

const KEY = 'cinebusca:favorites:v1';
// Lê e valida a lista do localStorage. Retorna uma lista vazia se os dados estiverem
// ausentes, inválidos ou inacessíveis.
export function getFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(saved)
      ? saved
          .filter(
            (item) =>
              Number.isInteger(item?.id) &&
              item.id > 0 &&
              typeof item.title === 'string',
          )
          // Normaliza campos opcionais caso os dados locais tenham sido alterados.
          .map((item) => ({
            id: item.id,
            title: item.title,
            poster_path: typeof item.poster_path === 'string' ? item.poster_path : null,
            release_date:
              typeof item.release_date === 'string' ? item.release_date : '',
            vote_average:
              typeof item.vote_average === 'number' &&
              Number.isFinite(item.vote_average) &&
              item.vote_average >= 0 &&
              item.vote_average <= 10
                ? item.vote_average
                : 0,
          }))
      : [];
  } catch {
    return [];
  }
}
// Adiciona ou remove o filme e salva apenas os campos necessários aos cards. Retorna
// true quando o filme fica salvo.
export function toggleFavorite(movie) {
  const current = getFavorites();
  const exists = current.some((item) => item.id === movie.id);
  const next = exists
    ? current.filter((item) => item.id !== movie.id)
    : [
        ...current,
        {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
        },
      ];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    throw new Error(
      'Não foi possível salvar. Libere espaço ou habilite o armazenamento do navegador.',
    );
  }
  return !exists;
}
