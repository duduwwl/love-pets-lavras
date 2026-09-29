# Love Pets Lavras

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
