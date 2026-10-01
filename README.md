# Love Pets Lavras

## Publicação no GitHub Pages

- Site: https://duduwwl.github.io/love-pets-lavras/
- Produtos: https://duduwwl.github.io/love-pets-lavras/produtos/
- Agendamento: https://duduwwl.github.io/love-pets-lavras/agendar/
- Acesso da equipe: https://duduwwl.github.io/love-pets-lavras/equipe/
- Painel protegido: https://love-pets-lavras.duduwwl.chatgpt.site/admin
- Repositório: https://github.com/duduwwl/love-pets-lavras

A página inicial não contém o catálogo nem o formulário de reservas. O catálogo tem página própria e reúne 22 referências com descrição, indicação de uso, orientação de escolha e cuidados. O botão **Pedir pelo WhatsApp** abre uma mensagem com o produto selecionado; o envio depende do cliente. Todos os botões de agendamento abrem diretamente o formulário em `/agendar/` no GitHub Pages. A entrada da equipe abre o painel protegido no serviço da agenda.

O GitHub Pages publica os arquivos de `docs/` da branch `main`. Execute `node scripts/build-pages.mjs` após editar `public/`, e `node scripts/verify-pages.mjs` antes de enviar. Depois faça commit e push. Não são necessários tokens, segredos nem um servidor dentro do GitHub Pages.

**API e disponibilidade:** GitHub Pages hospeda todos os arquivos de interface. A API com banco e autenticação continua no serviço existente em `https://love-pets-lavras.duduwwl.chatgpt.site`, configurado apenas como origem de requisições em `docs/runtime.js`. A API pública já permite as consultas do GitHub Pages. O formulário carrega os horários reais e salva a solicitação como pendente. Se a consulta falhar, ele mostra um aviso, coleta a preferência e prepara um pedido pelo WhatsApp. Esse modo de contingência não salva reservas nem declara que um horário está livre. O cliente precisa enviar a mensagem e aguardar a confirmação da equipe. Nenhum dado do formulário é salvo em localStorage ou no repositório.

**Administração real:** `/equipe/` mantém a senha ilustrativa `lovepets-demo` já preenchida, conforme solicitado. Ela não autentica nem protege dados. Ao entrar, `/admin/` encaminha para o painel protegido do serviço da agenda. A conta autorizada é exigida ali. Esse painel mostra as reservas reais, permite confirmar horários e gerenciar produtos. O GitHub Pages não recebe os dados privados da equipe.

**Produtos e estoque:** A aba **Produtos da loja** no painel protegido lista os 22 itens originais e permite informar a quantidade de cada um. O estoque inicial fica sem número até a equipe conferir. Novos produtos exigem nome, categoria, descrição, preço, quantidade e foto. Um membro autorizado pode publicar, editar, ocultar ou excluir. Fotos novas são reduzidas para WebP no navegador e guardadas no R2; os dados e quantidades ficam no D1. O catálogo público consulta `/api/products` e mostra o estoque atualizado; `products.json` serve apenas como reserva se a API estiver indisponível.

**Disponibilidade:** Alterações nos dias e horários semanais do painel real são salvas automaticamente. Bloqueios e reservas usam a mesma base da agenda pública; a página de agendamento recarrega os horários visíveis a cada 30 segundos e ao voltar à aba. O servidor confere novamente cada horário no envio. O painel inicia no dia atual de Lavras; registros históricos não são apagados. Cada reserva pendente, confirmada ou concluída ocupa todos os intervalos de seu serviço. Cancelar libera os intervalos. Um dia sem intervalos livres ou bloqueado aparece como indisponível.

O Worker atualizado foi publicado no projeto original. Seu CORS permite `https://duduwwl.github.io` apenas nas rotas públicas da agenda; as rotas administrativas continuam restritas ao ambiente autenticado. A página de agendamento foi verificada no GitHub Pages consultando serviços e horários disponíveis da API em produção. Uma requisição inválida ao endpoint de reservas recebeu erro 400, com CORS correto e sem criar reserva. Os testes automatizados cobrem a criação de reservas e a prevenção de conflitos em banco temporário.

## Verificação

```sh
node scripts/build-pages.mjs
node scripts/verify-pages.mjs
node scripts/build.mjs
node scripts/test-worker.mjs
node scripts/test-demo.mjs
node scripts/preview-pages.mjs
```

A prévia das páginas fica em `http://127.0.0.1:8766/love-pets-lavras/`. Os testes do Worker usam SQLite em memória; não criam reservas reais. Os testes verificam conflitos, autorização administrativa, calendário, bloqueios e CORS. O verificador do Pages confere arquivos, links internos, imagens e os detalhes dos 22 produtos.

Para revisar larguras móveis e de tablet localmente, a prévia oferece `/__responsive?width=390` e `/__responsive?width=820`, usando um iframe da mesma origem. A tela de 390 px foi conferida com menu e detalhes de produto, e a de 820 px com a página inicial. Ambas não apresentaram rolagem horizontal.

## Imagens

As fotos originais de produto são referências ilustrativas; o estoque inicial e os preços precisam ser informados pela equipe. A imagem de banho e tosa em `public/assets/banho-love-pets.webp` foi editada com a ferramenta integrada de geração de imagens. Brief: preservar o cachorro inteiro e reconstruir o cenário com paredes creme, móveis vermelhos, detalhes laranja, madeira marrom e a logo Love Pets. O gato em `public/assets/gato-hero.webp` foi gerado com o brief: fotografia editorial realista de um gato em ambiente acolhedor, tons laranja, creme e marrom, sem texto. A identificação de imagens ilustrativas é mantida.

A primeira foto da abertura é `public/assets/equipe-na-loja.webp`, restaurada com a ferramenta integrada de imagem a partir da fotografia fornecida da profissional com o cão. A geração preservou o contexto da loja e aumentou a nitidez; a imagem foi convertida para WebP com qualidade 95. A etiqueta visual de imagem ilustrativa sobre a foto de banho foi retirada a pedido; o texto alternativo continua identificando sua natureza. `public/assets/patinhas.svg` é uma decoração vetorial leve para o fundo. A logo da introdução e a do cartão de contato foram removidas. O cartão de banho e tosa usa os emojis de cão e gato lado a lado. O contato incorpora um mapa do endereço da loja. Os títulos principais usam Cormorant Garamond em tamanho menor e peso leve.

Site da Love Pets com catálogo visual, agendamento online e painel administrativo. O Worker em `worker/index.js` atende a página e as rotas de API; o banco D1 guarda agendamentos, horários semanais, duração dos serviços e bloqueios.

## Agenda

- Página pública: `/agendar`. O cliente escolhe serviço, cão ou gato, dia e horário e informa contato. A reserva entra como **pendente** até a equipe confirmar.
- Painel: `/admin`. Acesso restrito por autenticação ChatGPT e pela lista de e-mails em `ADMIN_EMAILS`, configurada no ambiente da hospedagem. Nunca use a interface como única proteção; todas as rotas administrativas validam a conta no servidor.
- O intervalo padrão é de 30 minutos. As opções públicas são Banho (60 minutos) e Banho e tosa (120 minutos). A opção de Tosa isolada foi removida do formulário e da demonstração; permanece no banco original para preservar registros existentes. Os valores são editáveis no painel real. A disponibilidade inicial é terça a sábado, 12h–18h, até 45 dias à frente. Confirme os horários reais antes de anunciar a agenda.
- `calendar_cells` usa chave única por data e intervalo para impedir reservas ou bloqueios sobrepostos. Uma solicitação cancelada libera os intervalos.
- `/api/calendar.ics?token=...` oferece assinatura iCal somente de leitura para Google Calendar e Outlook. O link é mostrado apenas no painel e protegido pelo segredo `CALENDAR_FEED_TOKEN` no ambiente da hospedagem. Mudanças são feitas no painel.
- O esquema é definido em `db/schema.ts`; a migração inicial gerada pelo Drizzle está em `drizzle/`. Migrações aplicadas não devem ser alteradas.

## Desenvolvimento

`node scripts/build.mjs` gera `dist/server/index.js` com os arquivos de `public/` embutidos. `node scripts/test-worker.mjs` executa verificações de reserva, conflito, administração e iCal com SQLite em memória. `node scripts/preview.mjs` inicia uma prévia local com dados temporários. `dist/` e `node_modules/` não fazem parte do código-fonte versionado.

O catálogo em `public/products.json` reúne 22 referências ilustrativas. As imagens representam estilos, não estoque confirmado; modelos, preços e disponibilidade são consultados com a loja.
