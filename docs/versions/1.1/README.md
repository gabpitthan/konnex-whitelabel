# Whitelabel Whaticket — versão 1.1

Data: 2026-07-28  
Estado: base de desenvolvimento concluída

## Objetivo

Instalar o projeto com isolamento e criar uma primeira base funcional e segura para modernização.

## Entregas

- Aplicação publicada em `whitelabel.usekonnex.com`.
- API publicada em `api-whitelabel.usekonnex.com`.
- PostgreSQL, Redis, backend e frontend isolados em Docker.
- Nginx, DNS e HTTPS configurados.
- Baileys migrado do fork 6.7.5 para o pacote oficial 6.7.22.
- Geração de QR corrigida.
- Reconexão infinita substituída por backoff limitado.
- Código destrutivo e telemetria externa removidos.
- SQL interpolado removido dos primeiros serviços críticos.
- FlowBuilder protegido por `companyId` em exclusão e duplicação.

## Validação

- Build TypeScript aprovado.
- Login administrativo aprovado.
- Persistência após restart aprovada.
- Endpoint autenticado do FlowBuilder aprovado.
- QR gerado em menos de um segundo.

## Limitações

- Envio e recebimento ainda dependiam do pareamento real.
- Cobertura multiempresa ainda incompleta.
- Projeto ainda sem suíte automatizada.
