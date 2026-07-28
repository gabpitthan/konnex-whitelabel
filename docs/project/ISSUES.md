# Problemas conhecidos

| ID | Severidade | Estado | Problema |
|---|---|---|---|
| ENG-001 | Crítico | aberto | Não há suíte automatizada relevante. |
| SEC-001 | Crítico | aberto | Isolamento multiempresa ainda não foi auditado/testado integralmente. |
| WA-001 | Alto | parcial | QR funciona; envio, recebimento, mídia e reconexão aguardam teste real. |
| FE-001 | Alto | aberto | Frontend possui 105 vulnerabilidades npm reportadas no build. |
| BE-001 | Alto | aberto | Backend possui dependências legadas e vulnerabilidades conhecidas. |
| OPS-001 | Alto | aberto | Backend/frontend ainda não possuem healthchecks próprios. |
| OBS-001 | Médio | aberto | Logs sem correlação completa e observabilidade incompleta. |
| FE-002 | Médio | aberto | Bundle principal grande e muitos avisos legados de lint. |
| API-001 | Médio | investigar | Há indícios de montagem duplicada de rotas de mensagens/webhooks. |

Problemas corrigidos pertencem ao changelog e aos READMEs de versão, não devem continuar descritos como falhas atuais.
