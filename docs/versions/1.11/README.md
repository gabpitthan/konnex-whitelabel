# Whitelabel Whaticket — versão 1.11

Data: 2026-07-29  
Estado: publicada

## Objetivo

Adicionar a fundação segura de exclusividade distribuída das sessões WhatsApp:
lease Redis tenant-aware, fencing monotônico PostgreSQL, CAS de lifecycle e
credenciais e perda fail-closed de ownership.

## Escopo

- migration aditiva com sequence e `Whatsapps.sessionFence`;
- lease com token opaco, TTL, renovação e release condicionais;
- fence nos estados `OPENING`, `qrcode`, `CONNECTED` e `DISCONNECTED`;
- auth state condicionado ao owner corrente;
- fechamento sem logout/purge ao perder o lease;
- proteção central antes de envios pelo socket;
- testes de concorrência, tenant e owner obsoleto.

## Limite deliberado

O modo cluster continuará bloqueado. Handlers longos de mensagens, tickets,
contatos e contadores ainda precisam propagar o fence até a mesma transação
PostgreSQL da mutação para eliminar toda janela TOCTOU.

## Migration e rollback

A migration é aditiva. O rollback operacional volta a imagem 1.10 e preserva
a coluna/sequence; o `down` existe para ambientes descartáveis, mas não deve
ser executado durante rollback de produção.

## Evidência

- 8 suítes P0 e 34 testes aprovados;
- Redis 7 aprovou expiração, ABA e auth write atômico;
- backend e frontend compilaram em imagens reproduzíveis;
- migration aplicada e coluna/sequence confirmadas;
- smoke aprovou frontend e API 1.11;
- restart real fechou recursos após `SIGTERM` em 1 ms e recuperou sem
  migration pendente.
