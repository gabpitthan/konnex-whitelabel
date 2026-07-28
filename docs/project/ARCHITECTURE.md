# Arquitetura operacional

- Frontend React 17 + Material UI legado, servido por Nginx em `127.0.0.1:8090`.
- Backend Node.js 20 + Express + TypeScript + Sequelize 5 em `127.0.0.1:3007`.
- PostgreSQL 16 e Redis 7 exclusivos, sem portas públicas.
- Rede Docker exclusiva `whitelabel_internal`.
- Proxy Nginx do host publica frontend e API com HTTPS.
- Multiempresa baseada em `companyId`; o backend é a fronteira obrigatória de autorização.
- Código e compose: `/root/whitelabel-whaticket`.
- Outros projetos do servidor estão fora do escopo e não podem ser reiniciados ou reutilizados.

Antes de modificar banco, autenticação, WhatsApp ou infraestrutura, consultar `PROJECT_STATE.md` e registrar decisão arquitetural quando houver mudança duradoura.
