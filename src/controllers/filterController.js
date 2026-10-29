import {
  GENRES,
  LANGUAGES,
  SORTS,
  readFilters,
  searchParams,
} from '../utils/searchFilters.js';

export function setupFilters(form, route) {
  const toggle = form.querySelector('[data-filter-toggle]');
  const panel = form.querySelector('#search-filters');
  // Abre ou recolhe o painel e mantém o estado acessível do botão sincronizado.
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
  });
  // Adiciona ao select indicado as opções definidas no mapa de valores e rótulos.
  function options(name, entries) {
    if (!form.elements[name]) return;
    const choices = Object.entries(entries);
    // Ordena pelo nome exibido, não pelos códigos numéricos usados pelo TMDB.
    if (name === 'genero') {
      choices.sort((left, right) => left[1].localeCompare(right[1], 'pt-BR'));
    }
    for (const [value, text] of choices)
      form.elements[name].add(new Option(text, value));
  }
  options('genero', GENRES);
  options('idioma', LANGUAGES);
  for (const [name, value] of Object.entries({
    q: route.query,
    ano: route.filters.year,
    genero: route.filters.genre,
    nota: route.filters.rating || '0',
    idioma: route.filters.language,
    ordem: route.filters.sort,
    classificacao: route.filters.certification,
  }))
    if (form.elements[name]) form.elements[name].value = value;
  const sortInput = form.elements.ordem;
  const sortToggle = form.querySelector('[data-sort-toggle]');
  const sortArrow = form.querySelector('[data-sort-arrow]');
  const sortLabel = form.querySelector('[data-sort-label]');
  function syncSort() {
    sortArrow.textContent = sortInput.value === 'popularity.desc' ? '↑' : '↓';
    sortLabel.textContent = SORTS[sortInput.value];
    sortToggle.setAttribute(
      'aria-label',
      `Alternar ordenação por popularidade; atual: ${SORTS[sortInput.value]}`,
    );
  }
  sortToggle.addEventListener('click', () => {
    sortInput.value = sortInput.value === 'popularity.desc'
      ? 'popularity.asc'
      : 'popularity.desc';
    syncSort();
  });
  syncSort();
  // Atualiza o valor acessível e o texto exibido ao lado da barra de nota.
  function sync() {
    // Atualiza a nota enquanto a barra é arrastada, sem enviar o formulário.
    const selectedRating = Number(form.elements.nota.value);
    const ratingText = selectedRating > 0
      ? `${selectedRating} / 10 ou mais`
      : 'Sem nota mínima';
    const ratingOutput = form.querySelector('[data-rating-value]');
    if (ratingOutput) ratingOutput.textContent = ratingText;
    form.elements.nota.setAttribute('aria-valuetext', ratingText);
  }
  form.addEventListener('input', sync);
  form.addEventListener('change', sync);
  sync();
}
// Lê os campos e o botão acionado para montar a URL. Aplicar filtros usa Discover;
// Buscar com texto usa Search.
export function filterFormUrl(form, submitter) {
  const data = new FormData(form);
  const params = new URLSearchParams(data);
  const query = (data.get('q') || '').trim();
  params.set('modo', submitter?.value === 'explorar' || !query ? 'explorar' : 'titulo');
  return `/busca?${searchParams({ query, filters: readFilters(params) })}`;
}
