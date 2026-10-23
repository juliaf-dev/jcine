# JCine — API de filmes

<!-- Guia para instalar, executar e compreender o projeto acadêmico. -->

Catálogo de filmes desenvolvido com React, Vite, JavaScript e Bootstrap.

A marca JCine combina as iniciais JC com cinema. O cabeçalho usa a imagem
completa enviada pela autora, em `public/jcine-logo.png`, sem separar símbolo
e nome. O PNG corrigido tem fundo transparente; o CSS enquadra a arte no
cabeçalho, compensando as margens vazias sem modificar a imagem original.
O ícone da aba usa a imagem reduzida JC enviada pela autora, incorporada em
`public/jcine-favicon.svg`. O enquadramento compensa as margens transparentes
para deixar as letras legíveis em tamanho pequeno.
Consome a API do TMDB com a chave disponibilizada pelo professor.
O botão **Saiba mais** abre uma página que consulta os detalhes do filme pelo ID.

## Como executar

Requisitos: Node.js 20.19+ ou 22.12+ e npm. O projeto foi executado com Node.js 24.
É necessária conexão com a internet para consultar filmes e carregar cartazes.

No PowerShell, entre na pasta correta e instale as dependências:

```powershell
cd "C:\Users\julia\Downloads\desg\projetos\api_filmes"
npm.cmd ci
```

O arquivo `.env` local já foi preparado com a chave fornecida na atividade.
Em outra máquina, crie o arquivo usando o modelo:

```powershell
Copy-Item .env.example .env
```

Preencha a variável no `.env`:

```dotenv
VITE_TMDB_API_KEY=sua_chave_do_tmdb
```

No Vite, `VITE_TMDB_API_KEY` substitui o nome `REACT_APP_KEY` usado no exemplo
original. Não coloque a chave no README ou no repositório. O `.gitignore` exclui
o `.env`; variáveis `VITE_` são incluídas no código enviado ao navegador e não
funcionam como segredos de servidor.

Inicie a aplicação:

```powershell
npm.cmd run dev
```

Abra o endereço mostrado no terminal, normalmente `http://localhost:5173`.
Se a porta estiver ocupada, o Vite poderá escolher outra. Mantenha o terminal
aberto e pressione **Ctrl+C** para encerrar. Reinicie após alterar o `.env`.
Não abra `index.html` diretamente pelo Explorador de Arquivos.

## Funcionalidades

- Página inicial com carrossel de até cinco destaques e filmes populares do TMDB.
- Cards com cartaz, título, ano, nota e link **Saiba mais**.
- Busca por título, com ano de lançamento opcional.
- Painel de filtros que expande ou recolhe ao lado do botão Buscar.
- Detalhes com sinopse, gêneros, duração, ano e avaliação.
- Favoritos salvos no navegador, com inclusão e remoção na tela de detalhes.
- Trailer do YouTube em nova aba, quando disponível.
- Paginação e suporte aos botões voltar e avançar do navegador.
- Layout responsivo, navegação inferior no celular e navegação por teclado.
- Mensagens de carregamento, resultados vazios, erros e nova tentativa.

Os favoritos são locais: não há conta, sincronização ou banco remoto.

O carrossel exibe apenas pontos centralizados e permite navegar por eles,
pelas teclas direcionais ou por gesto
horizontal no celular. Cada destaque abre os detalhes do próprio filme.
A troca automática acontece a cada sete segundos e pausa com o mouse sobre o
destaque, foco de teclado ou aba oculta. Se o navegador indicar preferência
por movimento reduzido, a navegação fica manual.
O timer é removido ao sair da página inicial.

Nos destaques, a frase de apresentação fica no topo do banner. Abaixo do título
e da nota aparece um trecho da sinopse, com até 170 caracteres, seguido do link
“… Saiba mais” para os detalhes do filme. O texto é reduzido por palavras.
Dados inválidos salvos no navegador são descartados ou normalizados.
O trailer é procurado primeiro em português e depois em inglês; quando não
existe, a interface informa a ausência.

## Busca e filtros

Os dados dos filmes são solicitados ao TMDB com `language=pt-BR`.
Títulos, sinopses e gêneros usam as traduções disponíveis no serviço.
O site não faz tradução automática; a API fornece os textos em português.

A barra principal pesquisa pelo título. O botão **Filtros** abre os critérios:

| Critério                 | Funcionamento                                                           |
| ------------------------ | ----------------------------------------------------------------------- |
| Gênero                   | Seleciona um gênero do TMDB.                                            |
| Ano                      | Filtra pelo ano de lançamento principal.                                |
| Nota mínima              | Barra de 0 a 10: 0 aceita qualquer nota; de 1 a 10 define o mínimo, com pelo menos 100 votos. |
| Idioma original          | Idioma de produção do filme; não indica dublagem disponível.            |
| Classificação indicativa | Faixa exata cadastrada para o Brasil: Livre, 10, 12, 14, 16 ou 18 anos. |

**Buscar** com um título usa `/search/movie`, com ano opcional.
**Aplicar filtros** limpa o título e usa `/discover/movie`, combinando os critérios.
Essa separação existe porque Discover não aceita pesquisa textual de título.
Buscar com o campo vazio também permite explorar o catálogo pelos filtros.
**Limpar filtros** retorna à busca inicial. As escolhas aplicadas ficam na URL e
são preservadas ao paginar e recarregar. Há um limite de 500 páginas na API.

### Tolerância a erros de digitação

O filtro de ano não impõe uma data histórica mínima de lançamento. Aceita anos
positivos até 2100, e o TMDB informa se existem registros para o ano escolhido.

Quando não há resultado exato na primeira página, a busca tenta até três
consultas parciais ao TMDB e compara os títulos encontrados. Aceita pequenas
trocas, inversões, inserções ou remoções de letras e exibe até oito sugestões
com **Você quis dizer…**. O texto original e o ano são preservados.

A comparação ignora acentos e diferenças entre maiúsculas e minúsculas.
Até um erro é aceito em nomes curtos e até dois a partir de oito caracteres.
Consultas menores que quatro ou maiores que 80 caracteres não usam sugestões.
O recurso depende dos candidatos retornados pela API: não corrige qualquer
nome e não substitui uma busca global aproximada no catálogo inteiro.

## Organização dos arquivos

```text
api_filmes/
├── public/
│   ├── jcine-logo.png
│   └── jcine-favicon.svg
├── src/
│   ├── controllers/
│   │   ├── carouselController.js
│   │   ├── filterController.js
│   │   └── movieController.js
│   ├── pages/
│   │   ├── Details.html
│   │   ├── Favorites.html
│   │   ├── Home.html
│   │   ├── Layout.html
│   │   ├── NotFound.html
│   │   └── Search.html
│   ├── routers/
│   │   ├── AppRouter.jsx
│   │   └── routes.js
│   ├── styles/
│   │   ├── components.css
│   │   ├── details.css
│   │   ├── favorites.css
│   │   ├── global.css
│   │   ├── home.css
│   │   ├── not-found.css
│   │   └── search.css
│   ├── utils/
│   │   ├── favorites.js
│   │   ├── fuzzySearch.js
│   │   ├── searchFilters.js
│   │   └── tmdb.js
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── README.md
└── vite.config.js
```

HTML, CSS e JavaScript ficam separados. Cada página tem seu CSS em `styles`;
`components.css` contém elementos reutilizados, e `global.css` define a base,
o cabeçalho, o rodapé e a navegação. Os CSS são importados em `main.jsx`.

### Como acompanhar o código

1. `index.html` carrega `main.jsx`, que monta o componente `App`.
2. `AppRouter` insere o layout HTML local e inicia o controller em `useEffect`.
3. `routes.js` identifica a tela e valida seus parâmetros.
4. `movieController.js` seleciona o template e carrega os dados necessários.
5. `filterController.js` cuida do formulário e da expansão dos filtros.
6. Os utilitários centralizam API, favoritos, URLs e sugestões de títulos.

O projeto usa React para montagem e ciclo de vida; o conteúdo das telas é
preenchido pelo controller com a API do DOM. Não utiliza React Router.
A navegação usa History API, sem recarregar a página.

Os templates inseridos por `innerHTML` são arquivos locais do projeto.
Textos recebidos da API são atribuídos com `textContent`, sem interpolação
em HTML. As consultas usam timeout de 20 segundos e são canceladas ao navegar,
para evitar respostas antigas alterando outra tela.

## Rotas e exemplos de erro

| URL                                     | Resultado                                 |
| --------------------------------------- | ----------------------------------------- |
| `/`                                     | Catálogo e destaque.                      |
| `/busca?q=batman`                       | Busca por título.                         |
| `/busca?q=batman&ano=2005`              | Título combinado com ano.                 |
| `/busca?modo=explorar&genero=28&nota=7` | Ação com nota mínima 7.                   |
| `/filme/157336`                         | Detalhes de Interestelar.                 |
| `/favoritos`                            | Filmes salvos neste navegador.            |
| `/qualquer-coisa`                       | Tela de página não encontrada (rota 404). |

Para testar uma **busca sem resultados**, pesquise
`zzzzqqqxxxyyynenhumfilme12345`. Isso mostra a mensagem dentro da busca, não a
tela de rota 404. O exemplo depende do catálogo existente no TMDB.

Para testar **ID de filme inexistente**, abra `/filme/999999999`.
Uma resposta 404 do TMDB mostra **Filme não encontrado** na tela de detalhes.

## Comandos do projeto

| Comando                    | Finalidade                                  |
| -------------------------- | ------------------------------------------- |
| `npm.cmd ci`               | Instala as versões registradas no lockfile. |
| `npm.cmd run dev`          | Inicia o servidor de desenvolvimento.       |
| `npm.cmd run build`        | Gera a versão de produção em `dist`.        |
| `npm.cmd run preview`      | Serve localmente o build já gerado.         |

Os exemplos usam `npm.cmd` para funcionar no PowerShell sem depender da
permissão de execução de scripts `.ps1`. Em outros terminais, use `npm`.

## Arquivos para enviar ao GitHub

Envie `src`, `public`, `index.html`, `package.json`, `package-lock.json`, `vite.config.js`,
`README.md`, `.env.example` e `.gitignore`.

Não envie `.env`, `node_modules` ou `dist`. A outra pessoa deve instalar as
dependências e configurar a própria cópia do `.env` conforme as instruções acima.

## Padrão de código

O CSS segue **mobile first**: os estilos base atendem primeiro ao celular.
As media queries usam `min-width` para ampliar o layout progressivamente:
361px para organizar a barra de busca, 601px para navegação de telas maiores,
761px para uma grade de quatro colunas e 1001px para cinco colunas.
No celular, o catálogo tem duas colunas e navegação inferior fixa; o rodapé
reserva espaço para não ficar coberto. Cada página mantém seu CSS separado.

- Indentação de dois espaços, UTF-8 e largura preferida de 88 caracteres.
- Cabeçalhos JavaScript, JSX e CSS em `/* ... */`, sem asteriscos por linha.
- Comentários de funções e trechos JavaScript em `//`.
- Comentários HTML em `<!-- ... -->` e de ambiente em `#`.
- Cabeçalhos orientam a leitura e indicam os módulos relacionados.
- Arquivos JSON não recebem comentários; as regras ficam documentadas aqui.

A formatação atual é mantida manualmente, seguindo o padrão acima.

`package.json` define scripts e dependências, e `package-lock.json` fixa as
versões instaladas. `node_modules`, `dist` e `.env`
não devem ser versionados; as exclusões estão no `.gitignore`.

## Publicação

Execute `npm.cmd run build` e publique o conteúdo de `dist` em uma hospedagem
estática. Configure o fallback das rotas para `index.html`, permitindo abrir
links como `/filme/157336` diretamente. Configure a variável de ambiente antes
do build. O servidor `dev` é destinado ao desenvolvimento local.

## Referências e créditos

Os símbolos PNG de classificação indicativa em `public/classificacao` foram
obtidos na [página oficial do Ministério da Justiça](https://www.gov.br/mj/pt-br/assuntos/seus-direitos/classificacao-1/simbolos-de-autoclassificacao).
O filtro usa opções de seleção única com imagens locais, permitindo toque e
navegação por teclado. Os valores enviados ao TMDB permanecem os mesmos.

- [Repositório do professor](https://github.com/profdiegocandido/api-filme-react).
- [Protótipo no Figma](https://www.figma.com/design/uCZVG1zgz43M7sAWkujhHr/Untitled).
- [API do TMDB](https://developer.themoviedb.org/docs/getting-started).
- [Bootstrap](https://getbootstrap.com/).

Dados e imagens são fornecidos pelo TMDB. O produto usa a API do TMDB, mas não
é endossado ou certificado pelo TMDB. O projeto é uma atividade acadêmica;
as classificações e demais informações dependem dos registros disponíveis na API.
