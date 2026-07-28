# Whitelabel Whaticket — versão 1.8

Data: 2026-07-28  
Estado: publicada para validação técnica e do usuário

## Objetivo

Corrigir o contrato Socket.IO incompatível e estabelecer isolamento multiempresa verificável no transporte em tempo real.

## Entregue

- namespace canônico `/workspace-{companyId}`;
- autenticação Socket.IO pelo campo `auth.token`, sem token na URL;
- validação do JWT real com `id` e `companyId` numéricos;
- confirmação do usuário no banco e vínculo obrigatório entre namespace e empresa assinada;
- salas com nomes segregados por empresa, ticket e status;
- autorização de entrada em ticket por `ticketId + companyId`;
- payloads numéricos e aliases temporários para eventos legados;
- singleton do frontend reiniciado quando a identidade muda;
- reconexão nativa com backoff, sem temporizador paralelo;
- limpeza do socket no logout e atualização da autenticação após refresh;
- ponte central temporária que converte emissores legados `io.of("N")` para o namespace canônico;
- logs estruturados e sanitizados de conexão, rejeição e desconexão.

## Segurança multi-tenant

O backend rejeita a conexão antes de criar a sessão quando o `companyId` do namespace difere daquele assinado no JWT. A entrada em sala de ticket consulta o banco com os dois identificadores e devolve uma resposta genérica quando o ticket não pertence à empresa.

## Compatibilidade

Mais de cem emissores legados ainda usam namespaces numéricos. Eles continuam funcionando por uma normalização central no servidor. Essa ponte é deliberadamente temporária; a substituição progressiva consta no backlog.

## Validação

- TypeScript/backend: compilado;
- frontend de produção: compilado;
- testes unitários/serviço: 8 de 8 aprovados;
- deploy conjunto de backend e frontend: concluído;
- smoke: frontend ativo e API em `1.8`;
- navegador autenticado desktop `1440×900`: sem erro de console, página ou rede;
- navegador autenticado mobile `390×844`: sem erro de console, página ou rede;
- overflow horizontal: ausente nos dois viewports;
- conexão no namespace próprio: aceita;
- tentativa com token real no namespace estrangeiro: rejeitada com `TENANT_NAMESPACE_MISMATCH`.

## Limitações conhecidas

- o ambiente possui apenas uma empresa e nenhum ticket; não foram criados dados artificiais em produção;
- o teste A/B de namespace foi realizado no runtime publicado; o isolamento de sala por ticket foi comprovado por teste automatizado;
- a política da sala mantém o comportamento legado de transmissão dentro da empresa e ainda não adiciona restrição por fila;
- ainda falta uma suíte E2E Socket.IO permanente no repositório;
- o build frontend permanece lento e o bundle legado continua grande.

## Próximo passo

Executar `REL-002` e `REL-003`: ciclo de vida single-flight das sessões WhatsApp e persistência Redis do estado de autenticação com falha explícita, epoch e cleanup central.
