/*
  Este controller coordena o funcionamento das telas do JCine.
  Comece por mountApplication: ela registra eventos e chama render.
  render consulta a rota, escolhe um HTML de pages e busca os dados no TMDB.
  Os elementos data-* dos templates indicam onde inserir conteúdo e ações.
  Dados externos entram por textContent; innerHTML recebe só templates locais.
  Ao mudar de rota, consultas antigas são canceladas para evitar respostas
  atrasadas. A limpeza final remove os eventos quando o React desmonta a tela.
 */

import home from '../pages/Home.html?raw';
import notFound from '../pages/NotFound.html?raw';
import { resolveRoute } from '../routers/routes.js';
import { request, imageUrl, movieYear, movieRating } from '../utils/tmdb.js';
import details from '../pages/Details.html?raw';
import search from '../pages/Search.html?raw';
import { setupFilters, filterFormUrl } from './filterController.js';
import { searchParams, searchRequest, isValidYear } from '../utils/searchFilters.js';
const getFavorites = () => [];
const pages = { home, notFound, details, search };
const pageTitles = {
  home: 'Descubra seu próximo filme',
  search: 'Buscar filmes',
  favorites: 'Seus favoritos',
  details: 'Detalhes do filme',
  notFound: 'Página não encontrada',
};

export function mountApplication(root) {
  const main = root.querySelector('#main');
  let abort;
  let disposed = false;
  let cleanupCarousel;
  // Procura um elemento somente dentro do conteúdo da página atual.
  const find = (selector) => main.querySelector(selector);
  // O resumo é opcional: sua remoção no HTML não deve interromper os resultados.
  function setResultLabel(text) {
    const label = find('[data-result-label]');
    if (label) label.textContent = text;
  }
  // Atualiza o histórico sem recarregar a página, renderiza a rota e leva rolagem e
  // foco para o conteúdo.
  function navigate(url) {
    history.pushState(null, '', url);
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
    main.focus({ preventScroll: true });
  }
  // Marca o item ativo da navegação e atualiza a quantidade de favoritos exibida no
  // cabeçalho.
  function updateNav(route) {
    root.querySelectorAll('nav a').forEach((link) => {
      const active =
        link.pathname ===
        (route.name === 'favorites'
          ? '/favoritos'
          : ['search', 'details'].includes(route.name)
            ? '/busca'
            : '/');
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    root.querySelector('[data-favorite-count]').textContent = getFavorites().length;
  }
  // Substitui a mensagem de carregamento, erro ou ausência de resultados. Pode oferecer
  // um botão de nova tentativa.
  function status(message, retry = false) {
    const box = find('[data-status]');
    if (!box) return;
    box.replaceChildren();
    box.className = message ? 'status-box' : '';
    if (!message) return;
    const text = document.createElement('p');
    text.textContent = message;
    box.append(text);
    if (retry) {
      const button = document.createElement('button');
      button.className = 'btn btn-outline-light btn-sm';
      button.textContent = 'Tentar novamente';
      button.addEventListener('click', render);
      box.append(button);
    }
  }
  // Configura a imagem e seu texto alternativo; mostra uma mensagem se o cartaz não
  // existir ou falhar.
  function setPoster(img, path, title) {
    img.alt = `Cartaz de ${title}`;
    const fallback = img.parentElement.querySelector('.poster-fallback');
    // Oculta o cartaz que não carregou e apresenta a alternativa textual no mesmo
    // espaço.
    function unavailable() {
      img.hidden = true;
      if (fallback) fallback.hidden = false;
    }
    const src = imageUrl(path);
    if (src) {
      img.src = src;
      img.onerror = unavailable;
    } else unavailable();
  }
  // Limpa a grade e clona um template por filme, preenchendo título, nota, ano e links
  // com dados da API.
  function renderCards(movies) {
    const grid = find('[data-grid]');
    grid.replaceChildren();
    movies.forEach((movie) => {
      const fragment = root.querySelector('#card-template').content.cloneNode(true);
      fragment
        .querySelectorAll('a')
        .forEach((link) => (link.href = `/filme/${movie.id}`));
      fragment
        .querySelector('.poster-link')
        .setAttribute('aria-label', `Ver detalhes de ${movie.title}`);
      setPoster(fragment.querySelector('img'), movie.poster_path, movie.title);
      fragment.querySelector('h3').textContent = movie.title;
      fragment.querySelector('.movie-year').textContent = movieYear(movie);
      fragment.querySelector('.card-rating').textContent = `★ ${movieRating(movie)}`;
      grid.append(fragment);
    });
  }
  // Cria os links anterior e próxima preservando a busca e os filtros. Respeita o
  // limite de 500 páginas do TMDB.
  function paginate(data, route) {
    const box = find('[data-pagination]');
    const total = Math.min(data.total_pages || 1, 500);
    if (!box || total <= 1) return;
    // Cria um link de paginação com os parâmetros atuais preservados.
    const link = (label, page) => {
      const a = document.createElement('a');
      const params =
        route.name === 'search'
          ? searchParams(route, page)
          : new URLSearchParams({ pagina: page });
      a.href = `${route.name === 'search' ? '/busca' : '/'}?${params}`;
      a.dataset.route = '';
      a.className = 'btn btn-outline-light btn-sm';
      a.textContent = label;
      return a;
    };
    if (route.page > 1) box.append(link('←', route.page - 1));
    const label = document.createElement('span');
    label.textContent = `Página ${route.page} de ${total}`;
    box.append(label);
    if (route.page < total) box.append(link('→', route.page + 1));
  }
  // Consulta o filme e seus vídeos, preenche os detalhes e conecta os favoritos.
  // Procura trailer em inglês se faltar em português.
  async function loadDetails(route, signal) {
    const movie = await request(
      `/movie/${route.id}`,
      { append_to_response: 'videos' },
      signal,
    );
    if (signal.aborted || disposed) return;
    status('');
    document.title = `${movie.title} | JCine`;
    const article = find('.detail-layout');
    article.hidden = false;
    setPoster(article.querySelector('img'), movie.poster_path, movie.title);
    article.querySelector('h1').textContent = movie.title;
    const duration = movie.runtime
      ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}min`
      : 'Duração não informada';
    article.querySelector('.detail-meta').textContent =
      `★ ${movieRating(movie)} / 10 · ${movieYear(movie)} · ${duration}`;
    article.querySelector('.tagline').textContent = movie.tagline || '';
    article.querySelector('.genres').textContent =
      movie.genres?.map((genre) => genre.name).join(' · ') || 'Gênero não informado';
    article.querySelector('.overview').textContent =
      movie.overview || 'Sinopse ainda não disponível em português.';
    let videos = movie.videos?.results || [];
    if (!videos.some((video) => video.site === 'YouTube' && video.type === 'Trailer')) {
      try {
        const alternateVideos = await request(
          `/movie/${route.id}/videos`,
          { language: 'en-US' },
          signal,
        );
        videos = [...videos, ...(alternateVideos.results || [])];
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }
    if (signal.aborted || disposed) return;
    const video = videos.find(
      (item) =>
        item.site === 'YouTube' && item.type === 'Trailer' && /^[\w-]+$/.test(item.key),
    );
    if (video) {
      const link = article.querySelector('[data-trailer]');
      link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(video.key)}`;
      link.hidden = false;
    } else article.querySelector('[data-no-trailer]').hidden = false;
  }
  // Cancela a consulta anterior, escolhe o template da rota e carrega seus dados. Trata
  // estados vazios, erros e sugestões de títulos.
  async function render() {
    abort?.abort();
    abort = new AbortController();
    const { signal } = abort;
    const route = resolveRoute(window.location);
    main.innerHTML = pages[route.name];
    updateNav(route);
    document.title = pageTitles[route.name] + ' | JCine';
    if (route.name === 'notFound') return;
    if (route.name === 'search') {
      setupFilters(find('.filter-form'), route);
      if (route.filters.invalidYear) { showInvalidYear(); return; }
    }
    
    if (route.name === 'search' && route.filters.mode === 'titulo' && !route.query) return;
    status('Carregando filmes…');
    try {
      if (route.name === 'details') { await loadDetails(route, signal); return; }
      const query = route.name === 'search' ? searchRequest(route) :
        { path: '/movie/popular', params: {page: route.page, include_adult: false} };
      const data = await request(query.path, query.params, signal);
      if (signal.aborted || disposed) return;
      
      
      status('');
      if (!data.results.length) showEmptyResults(route);
      renderCards(data.results);
      paginate(data, route);
      if (route.name === 'search') setResultLabel(`${data.total_results} filmes encontrados.`);
    } catch (error) {
      if (error.name !== 'AbortError' && !signal.aborted && !disposed) status(error.message, true);
    }
  }
    function showEmptyResults(route, invalidYear = false) {
      const template = find('#empty-results-template');
      if (!template) {
        status('Nenhum filme encontrado no momento. Tente novamente mais tarde.');
        return;
      }
      const content = template.content.cloneNode(true);
        if (invalidYear) content.querySelector('h3').textContent = 'Ano inválido';
        else if (route.filters.year) {
          content.querySelector('h3').textContent =
            `Nenhum filme encontrado em ${route.filters.year}`;
        }
        const message = invalidYear
          ? 'Digite um ano inteiro de 1 a 2100 ou deixe o campo vazio. ' +
            'Nenhuma pesquisa foi enviada com esse valor.'
          : route.filters.mode === 'explorar'
        ? 'Nenhum filme corresponde aos filtros selecionados. ' +
          'Tente outro ano, gênero ou uma nota mínima menor.'
        : `Não encontramos resultados para “${route.query}”. ` +
          'Confira a digitação ou tente outro título ou ano.';
      content.querySelector('[data-empty-message]').textContent = message;
      const box = find('[data-status]');
      box.className = 'status-box empty-results';
      box.append(content);
    }

    // Exibe a validação na própria tela, inclusive se o painel estiver recolhido.
    function showInvalidYear() {
      status('');
      find('[data-grid]')?.replaceChildren();
      find('[data-pagination]')?.replaceChildren();
      showEmptyResults(resolveRoute(window.location), true);
      const panel = find('#search-filters');
      if (panel) panel.hidden = false;
      find('[data-filter-toggle]')?.setAttribute('aria-expanded', 'true');
      const yearField = find('#filter-year');
      yearField?.setAttribute('aria-invalid', 'true');
      yearField?.focus({ preventScroll: true });
    }

    // Substitui apenas o balão nativo de ano pelo aviso visível na tela.
    function onInvalid(event) {
      if (event.target.id !== 'filter-year') return;
      event.preventDefault();
      showInvalidYear();
    }

    // Intercepta cliques simples em links internos marcados com data-route; preserva os
  // atalhos para abrir outra aba.
  function onClick(event) {
    const link = event.target.closest('a[data-route]');
    if (
      !link ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    navigate(link.href);
  }
  // Impede o recarregamento do formulário e navega para a URL correspondente à busca
  // simples ou aos filtros.

  function onSubmit(event) {
    if (!event.target.matches('.filter-form')) return;
    event.preventDefault();
    const yearField = event.target.elements.ano;
    if (!yearField.validity.valid || !isValidYear(yearField.value)) {
      showInvalidYear(); return;
    }
    navigate(filterFormUrl(event.target, event.submitter));
  }
  
  root.addEventListener('click', onClick);
  root.addEventListener('submit', onSubmit);
  root.addEventListener('invalid', onInvalid, true);
  window.addEventListener('popstate', render);
  
  render();
  return () => {
    disposed = true;
    abort?.abort();
    root.removeEventListener('click', onClick);
    root.removeEventListener('submit', onSubmit);
    root.removeEventListener('invalid', onInvalid, true);
    window.removeEventListener('popstate', render);
    
  };
}
