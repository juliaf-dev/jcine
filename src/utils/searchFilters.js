/*
  Define as opções aceitas e converte filtros entre formulário, URL e API.
  readFilters valida a URL; searchParams gera links preservando a seleção.
  searchRequest escolhe Search para título ou Discover para filtros.
  A classificação usa os dados do Brasil. A nota mínima exige 100 votos.
  Ao adicionar um critério, revise também Search.html e filterController.js.
 */

export const GENRES = {
  28: 'Ação',
  12: 'Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Documentário',
  18: 'Drama',
  10751: 'Família',
  14: 'Fantasia',
  36: 'História',
  27: 'Terror',
  10402: 'Música',
  9648: 'Mistério',
  10749: 'Romance',
  878: 'Ficção científica',
  10770: 'Filme para TV',
  53: 'Suspense',
  10752: 'Guerra',
  37: 'Faroeste',
};
export const LANGUAGES = {
  pt: 'Português',
  en: 'Inglês',
  es: 'Espanhol',
  fr: 'Francês',
  ja: 'Japonês',
  ko: 'Coreano',
  it: 'Italiano',
  de: 'Alemão',
};
export const SORTS = {
  'popularity.desc': 'Mais populares primeiro',
  'popularity.asc': 'Menos populares primeiro',
};
// Ano vazio não filtra; valores preenchidos devem ser inteiros de 1 a 2100.
export function isValidYear(year) {
  return year === '' || (/^\d{1,4}$/.test(year) && +year > 0 && +year <= 2100);
}
// Valida os parâmetros recebidos pela URL e aplica valores padrão quando uma opção não
// é reconhecida.
export function readFilters(params) {
  const year = params.get('ano') || '';
  const rating = params.get('nota') || '';
  return {
    mode: params.get('modo') === 'explorar' ? 'explorar' : 'titulo',
    // Valida o formato do ano sem impor um limite histórico de lançamento.
    year: isValidYear(year) ? year : '',
    invalidYear: !isValidYear(year),
    genre: Object.hasOwn(GENRES, params.get('genero')) ? params.get('genero') : '',
    rating: /^(?:[1-9]|10)$/.test(rating) ? rating : '',
    language: Object.hasOwn(LANGUAGES, params.get('idioma'))
      ? params.get('idioma')
      : '',
    certification: ['L', '10', '12', '14', '16', '18'].includes(
      params.get('classificacao'),
    )
      ? params.get('classificacao')
      : '',
    sort: Object.hasOwn(SORTS, params.get('ordem'))
      ? params.get('ordem')
      : 'popularity.desc',
  };
}
// Serializa os filtros e a página para links navegáveis, incluindo apenas os campos
// relevantes ao tipo de busca.
export function searchParams(route, page = 1) {
  const params = new URLSearchParams();
  if (route.filters.mode === 'explorar') {
    params.set('modo', 'explorar');
    for (const [key, value] of Object.entries({
      genero: route.filters.genre,
      nota: route.filters.rating,
      idioma: route.filters.language,
      ordem: route.filters.sort,
      classificacao: route.filters.certification,
    })) {
      if (value) params.set(key, value);
    }
  } else if (route.query) params.set('q', route.query);
  if (route.filters.year) params.set('ano', route.filters.year);
  if (page > 1) params.set('pagina', page);
  return params;
}
// Escolhe o endpoint e traduz os filtros para o TMDB. Classificação usa o Brasil; nota
// mínima exige pelo menos 100 votos.
export function searchRequest(route) {
  const f = route.filters;
  const params = { page: route.page, include_adult: false };
  if (f.year) params.primary_release_year = f.year;
  if (f.mode === 'titulo')
    return { path: '/search/movie', params: { ...params, query: route.query } };
  if (f.genre) params.with_genres = f.genre;
  if (f.language) params.with_original_language = f.language;
  if (f.certification) {
    params.certification_country = 'BR';
    params.certification = f.certification;
  }
  if (f.rating) params['vote_average.gte'] = f.rating;
  if (f.rating) params['vote_count.gte'] = 100;
  params.sort_by = f.sort;
  return { path: '/discover/movie', params };
}
