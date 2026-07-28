# Estado persistente — Whitelabel Whaticket

Última atualização: 2026-07-28

## Objetivo

Modernizar e desenvolver uma plataforma whitelabel de atendimento com WhatsApp e FlowBuilder, baseada no projeto Whaticket TurboFlow, mantendo isolamento dos demais sistemas do servidor.

## Instalação

- Código: `/root/whitelabel-whaticket`
- Painel: `https://whitelabel.usekonnex.com`
- API: `https://api-whitelabel.usekonnex.com`
- Frontend local: `127.0.0.1:8090`
- Backend local: `127.0.0.1:3007`
- Docker Compose: `/root/whitelabel-whaticket/compose.yaml`
- Nginx: `/etc/nginx/sites-available/whitelabel-whaticket`
- Certificado: `/etc/letsencrypt/live/whitelabel.usekonnex.com`
- DNS gerenciado na Cloudflare, atualmente em DNS direto para não conflitar com o modo SSL Flexible da zona.
- Credenciais administrativas ficam em `credentials.txt`, com permissão restrita. Não copiar segredos para esta memória.

## Isolamento

- PostgreSQL e Redis próprios, sem portas públicas.
- Rede Docker própria: `whitelabel_internal`.
- Volumes próprios para banco, Redis e arquivos públicos.
- Instâncias Whazing existentes continuam nas portas 8087/3001, 8088/3003 e 8089/3005.
- Wuzapi permanece em 8080 e o dashboard Konnex em 3002.

## Estado funcional validado

- Build de backend e frontend concluído.
- Migrations e seeds executados.
- Login administrativo validado localmente.
- Persistência do usuário validada após reinício.
- Endpoint autenticado `/flowbuilder` responde.
- Frontend publicado aponta para `api-whitelabel.usekonnex.com`.
- HTTPS válido no origin.

## Auditoria em andamento

Dimensão aproximada:

- 794 arquivos TypeScript no backend.
- 316 arquivos JS/TS no frontend.
- 268 migrations.
- 55 models.
- 44 arquivos de rotas.
- Nenhum teste automatizado encontrado.

### Riscos críticos já confirmados

1. `backend/src/helpers/GetWhatsapp.ts` contém telemetria/licenciamento externo com Supabase e uma rotina que executa `rm -rf /home/deploy/Multi100/*`. Remover antes de qualquer uso sério.
2. SQL montado por interpolação em serviços, incluindo mensagens e configurações de empresa, com risco de SQL injection.
3. Operações sem isolamento completo por `companyId`, incluindo exclusão de FlowBuilder somente por ID.
4. Helmet está importado, mas desativado.
5. Rotas públicas e webhooks precisam de revisão de autenticação, assinatura e rate limiting.
6. Projeto possui dependências antigas e vulnerabilidades npm críticas/altas.
7. Frontend mistura Material UI v4 e MUI v5.
8. FlowBuilder é monolítico: tela principal com cerca de 500 linhas e editor com cerca de 1.194 linhas.
9. Bundle principal do frontend tem aproximadamente 1,67 MB gzip.
10. Não existe suíte de testes.

## Falha atual do WhatsApp

- Conexão de teste criada com nome `Teste`, ID 1.
- Sintoma: QR não carrega e backend entra em loop de reconexão.
- Erro confirmado nos logs: HTTP 405 `Connection Failure`.
- O package usa um fork Git antigo: `github:zennn08/Baileys#profile-picture-url`.
- `backend/src/libs/wbot.ts` fixa manualmente a versão `[2, 3000, 1025052013]`.
- A biblioteca oficial atual em 2026 é `@whiskeysockets/baileys`; a linha atual possui mudanças importantes de protocolo, LID, segurança e conexão.
- A sessão `Teste` foi marcada como `DISCONNECTED` de forma reversível e o backend reiniciado para parar o loop.

## Direção técnica acordada

Antes de desenvolver novas telas:

1. Remover código destrutivo e telemetria/licenciamento desconhecido.
2. Criar repositório Git e baseline recuperável.
3. Atualizar o conector WhatsApp de forma isolada, com testes de QR, pairing, reconexão, envio e recebimento.
4. Corrigir isolamento multiempresa e SQL injection.
5. Adicionar validação backend, rate limiting, headers e logs seguros.
6. Criar testes mínimos de autenticação, tenant, conexão e FlowBuilder.
7. Depois modernizar frontend e decompor o FlowBuilder.

## Implementação — fase 1 (2026-07-28)

- Repositório Git criado; baseline recuperável no commit `7d7cb80`.
- `credentials.txt` incluído no `.gitignore`.
- Removido `backend/src/helpers/GetWhatsapp.ts`, que enviava dados para um Supabase externo e continha uma rotina destrutiva.
- Removidos o cron de licenciamento/telemetria, o serviço órfão e o seed `wtV`.
- Baileys migrado do fork `zennn08/Baileys` 6.7.5 para o pacote oficial `@whiskeysockets/baileys` 6.7.22.
- Versão do WhatsApp Web deixou de ser fixada manualmente e agora usa `fetchLatestBaileysVersion`.
- Reconexão infinita substituída por backoff exponencial limitado.
- Erros não recuperáveis 403, 405, logout e sessão inválida agora encerram a tentativa.
- Limite de renovações do QR aumentado de 3 para 6.
- Inicialização da sessão passa a responder assim que o QR estiver disponível, sem aguardar o telefone conectar.
- Teste real: `POST /whatsappsession/1` retornou HTTP 200 em menos de um segundo; registro ficou com status `qrcode` e QR válido.
- Removidos botões de demonstração hardcoded do envio por fluxo.
- Seeds deixaram de executar em todo restart. Só rodam quando `RUN_DB_SEEDS=true`.
- Dockerfile ajustado para permissões de `public`, `private`, `logs` e `certs`; rebuilds posteriores ficaram significativamente mais rápidos.
- SQL por interpolação removido da leitura/escrita de `CompaniesSettings` e da busca direta de mensagem.
- Exclusão e duplicação de FlowBuilder agora exigem o `companyId` autenticado.
- Build TypeScript concluído com sucesso e imagem atual implantada.
- Login, listagem de FlowBuilder e geração do QR revalidados após o deploy.

### Estado atual do teste WhatsApp

- Conexão `Teste` está em status `qrcode`.
- O usuário pode abrir o painel e escanear agora.
- Envio, recebimento, mídia e reconexão pós-pareamento ainda dependem do escaneamento real e devem ser validados em seguida.

## Regra de continuidade

Ao retomar este projeto, ler este arquivo antes de alterar código. Atualizá-lo após decisões, mudanças de arquitetura, migrations, deploys, incidentes e resultados de testes.
