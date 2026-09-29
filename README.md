# Love Pets Lavras

## Publicação no GitHub Pages

- Site: https://duduwwl.github.io/love-pets-lavras/
- Produtos: https://duduwwl.github.io/love-pets-lavras/produtos/
- Agendamento: https://duduwwl.github.io/love-pets-lavras/agendar/
- Acesso da equipe: https://duduwwl.github.io/love-pets-lavras/equipe/
- Repositório: https://github.com/duduwwl/love-pets-lavras

A página inicial não contém o catálogo nem o formulário de reservas. Eles têm páginas próprias. O catálogo reúne 22 referências com descrição, indicação de uso, orientação de escolha e cuidados. O botão **Pedir pelo WhatsApp** abre uma mensagem com o produto selecionado; o envio depende do cliente.

O GitHub Pages publica os arquivos de `docs/` da branch `main`. Execute `node scripts/build-pages.mjs` após editar `public/`, e `node scripts/verify-pages.mjs` antes de enviar. Depois faça commit e push. Não são necessários tokens, segredos nem um servidor dentro do GitHub Pages.

**Limite da hospedagem:** GitHub Pages hospeda arquivos estáticos. A agenda e o painel com banco e autenticação continuam no serviço existente em `https://love-pets-lavras.duduwwl.chatgpt.site`. A página de agendamento do Pages abre o formulário real pelo botão **Escolher dia e horário**. O acesso da equipe abre o painel protegido. Não há agendamento simulado em `localStorage`, nem dados de clientes dentro do repositório.

Nesta publicação, a conexão Sites selecionada não encontrou o projeto original. Por isso, as mudanças do Worker neste repositório ainda não foram publicadas nesse serviço. O Worker inclui suporte de CORS apenas às rotas públicas para `https://duduwwl.github.io`; as rotas administrativas continuam restritas à mesma origem. Após reconectar a conta proprietária e publicar o Worker, `node scripts/build-pages.mjs --direct-booking` pode gerar o formulário completo dentro do Pages. Não use esse modo antes de publicar o serviço e verificar a integração.

## Verificação

```sh
node scripts/build-pages.mjs
node scripts/verify-pages.mjs
node scripts/build.mjs
node scripts/test-worker.mjs
node scripts/preview-pages.mjs
```

A prévia das páginas fica em `http://127.0.0.1:8766/love-pets-lavras/`. Os testes do Worker usam SQLite em memória; não criam reservas reais. Os testes verificam conflitos, autorização administrativa, calendário, bloqueios e CORS. O verificador do Pages confere arquivos, links internos, imagens e os detalhes dos 22 produtos.

## Imagens

As fotos de produto são referências ilustrativas; não afirmam estoque, marca, composição exata ou preço. A imagem de banho e tosa em `public/assets/banho-love-pets.webp` foi editada com a ferramenta integrada de geração de imagens. Brief: preservar o cachorro inteiro e reconstruir o cenário com paredes creme, móveis vermelhos, detalhes laranja, madeira marrom e a logo Love Pets. O gato em `public/assets/gato-hero.webp` foi gerado com o brief: fotografia editorial realista de um gato em ambiente acolhedor, tons laranja, creme e marrom, sem texto. A identificação de imagens ilustrativas é mantida.

Site da Love Pets com catálogo visual, agendamento online e painel administrativo. O Worker em `worker/index.js` atende a página e as rotas de API; o banco D1 guarda agendamentos, horários semanais, duração dos serviços e bloqueios.

## Agenda

- Página pública: `/agendar`. O cliente escolhe serviço, cão ou gato, dia e horário e informa contato. A reserva entra como **pendente** até a equipe confirmar.
- Painel: `/admin`. Acesso restrito por autenticação ChatGPT e pela lista de e-mails em `ADMIN_EMAILS`, configurada no ambiente da hospedagem. Nunca use a interface como única proteção; todas as rotas administrativas validam a conta no servidor.
- O intervalo padrão é de 30 minutos. Banho ocupa 60 minutos, banho e tosa 120, tosa 90. Os valores são editáveis no painel. A disponibilidade inicial é terça a sábado, 12h–18h, até 45 dias à frente. Confirme os horários reais antes de anunciar a agenda.
- `calendar_cells` usa chave única por data e intervalo para impedir reservas ou bloqueios sobrepostos. Uma solicitação cancelada libera os intervalos.
- `/api/calendar.ics?token=...` oferece assinatura iCal somente de leitura para Google Calendar e Outlook. O link é mostrado apenas no painel e protegido pelo segredo `CALENDAR_FEED_TOKEN` no ambiente da hospedagem. Mudanças são feitas no painel.
- O esquema é definido em `db/schema.ts`; a migração inicial gerada pelo Drizzle está em `drizzle/`. Migrações aplicadas não devem ser alteradas.

## Desenvolvimento

`node scripts/build.mjs` gera `dist/server/index.js` com os arquivos de `public/` embutidos. `node scripts/test-worker.mjs` executa verificações de reserva, conflito, administração e iCal com SQLite em memória. `node scripts/preview.mjs` inicia uma prévia local com dados temporários. `dist/` e `node_modules/` não fazem parte do código-fonte versionado.

O catálogo em `public/products.json` reúne 22 referências ilustrativas. As imagens representam estilos, não estoque confirmado; modelos, preços e disponibilidade são consultados com a loja.
