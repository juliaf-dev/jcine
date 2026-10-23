/*
  Procura sugestões quando a primeira página não encontra o título exato.
  normalizeTitle padroniza o texto; editDistance mede a diferença entre nomes.
  suggestMovies consulta trechos no TMDB, filtra candidatos e remove duplicados.
  São exibidas até oito sugestões. A cobertura depende dos filmes retornados
  pela API, e o signal permite cancelar a busca quando o usuário navega.
 */

import { request } from './tmdb.js';

// Remove acentos e pontuação e padroniza letras e espaços para comparar os títulos.
export const normalizeTitle = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

// Distância de edição com troca de letras adjacentes (ex.: batamn).
// Calcula quantas edições separam dois textos, incluindo inversões de letras vizinhas.
// Quanto menor o valor, mais parecidos são os títulos.
export function editDistance(left, right) {
  const rows = Array.from({ length: left.length + 1 }, () =>
    Array(right.length + 1).fill(0),
  );
  for (let i = 0; i <= left.length; i++) rows[i][0] = i;
  for (let j = 0; j <= right.length; j++) rows[0][j] = j;
  for (let i = 1; i <= left.length; i++)
    for (let j = 1; j <= right.length; j++) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
      if (
        i > 1 &&
        j > 1 &&
        left[i - 1] === right[j - 2] &&
        left[i - 2] === right[j - 1]
      )
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
    }
  return rows[left.length][right.length];
}
// Busca candidatos por trechos do título, preserva o ano, remove duplicados e ordena
// por semelhança e popularidade. Usa o signal para cancelar consultas antigas.
export async function suggestMovies(query, year, signal) {
  const normalized = normalizeTitle(query);
  if (normalized.length < 4 || normalized.length > 80) return [];
  const variants = [
    ...new Set([
      normalized.slice(0, -1),
      normalized.slice(0, -2),
      normalized.slice(0, Math.max(3, Math.floor(normalized.length / 2))),
    ]),
  ];
  const responses = await Promise.all(
    variants.map(async (text) => {
      try {
        return await request(
          '/search/movie',
          {
            query: text,
            include_adult: false,
            ...(year ? { primary_release_year: year } : {}),
          },
          signal,
        );
      } catch (error) {
        if (signal?.aborted) throw error;
        return { results: [] };
      }
    }),
  );
  const unique = new Map();
  for (const response of responses)
    for (const movie of response.results) {
      const titles = [movie.title, movie.original_title]
        .filter(Boolean)
        .map(normalizeTitle);
      const distance = Math.min(
        ...titles.flatMap((title) => [
          editDistance(normalized, title),
          ...title
            .split(' ')
            .filter((word) => word.length >= 4)
            .map((word) => editDistance(normalized, word)),
        ]),
      );
      if (
        distance <= (normalized.length >= 8 ? 2 : 1) &&
        (!year || movie.release_date?.startsWith(year))
      )
        unique.set(movie.id, { ...movie, distance });
    }
  return [...unique.values()]
    .sort(
      (a, b) => a.distance - b.distance || (b.popularity || 0) - (a.popularity || 0),
    )
    .slice(0, 8);
}
