# Whitelabel Whaticket — versão 1.12

Data: 2026-07-29  
Estado: publicada

## Objetivo

Eliminar multiplicação de pools e SQL interpolado, adicionar readiness real e
estabelecer uma base mensurável para escala, desempenho e integridade.

## Escopo

- uma única instância/pool Sequelize por processo;
- defaults de pool compatíveis com orçamento de conexões;
- relatórios de mensagens com bind parameters, validação e tenant obrigatório;
- liveness sem dependências e readiness fail-closed para PostgreSQL/Redis/drain;
- healthchecks Docker;
- remoção da API `KEYS` não utilizada;
- pesquisa e plano persistente de produção.

## Limites

- os valores atuais do `.env` de produção ainda prevalecem sobre os novos
  defaults e serão ajustados somente com rollout observado;
- novos índices aguardam workload representativo;
- escala horizontal WhatsApp continua bloqueada pelo CAS transacional pendente.

## Evidência

- 11 suítes, 44 testes automatizados aprovados;
- backend e frontend compilaram em imagens reproduzíveis;
- liveness, readiness, healthchecks Docker, versão e smoke aprovados;
- restart real recebeu `SIGTERM`, fechou recursos em 2 ms e recuperou saudável;
- conexões ociosas da aplicação caíram de 6 para 1 após estabilização;
- Redis medido com 2,20 MB, zero evictions/rejeições, AOF `everysec` e
  `noeviction`;
- nenhuma migration;
- `.env.example` completo e sem segredos; histórico Git passou na varredura de
  padrões de tokens/chaves privadas.

## Como ainda pode falhar

- readiness executada a cada 10 s gera carga pequena, mas permanente;
- o token global de `/api/messagesRange` ainda não vincula identidade ao tenant;
- não existe `pg_stat_statements`, SLO ou alerta;
- PostgreSQL e Redis continuam singletons;
- conta canário WhatsApp e QA autenticado não foram repetidos.
