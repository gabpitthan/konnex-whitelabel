# Whitelabel Whaticket — versão 1.9

Data: 2026-07-29  
Estado: publicada para validação técnica

## Objetivo

Executar a primeira fase segura de `REL-002` e `REL-003`: impedir perda silenciosa de identidade do WhatsApp quando o Redis falha e reduzir corridas de inicialização no processo atual.

## Auth state Redis v2

- namespace `baileys:v2:{companyId:whatsappId}`;
- envelope versionado com ownership e SHA-256 do payload;
- serialização Baileys preservada com `BufferJSON`;
- leitura v2 primeiro e migração lazy do formato legado;
- legado preservado durante a janela de rollback;
- Redis indisponível gera falha explícita;
- JSON, checksum, versão ou ownership inválidos geram `BaileysAuthCorruptError`;
- falhas de escrita e remoção não são mais engolidas;
- falha ao persistir `creds.update` fecha o socket e entra na política limitada de recuperação;
- logout, reset e exclusão limpam chaves v2 e legadas.

## Lifecycle — primeira fase

- single-flight em processo por `companyId + whatsappId`;
- chamadas simultâneas compartilham a mesma inicialização;
- geração monotônica invalida eventos de sockets antigos;
- remoção usa a identidade exata do socket, não um índice stale;
- lookup de conexão exige `id + companyId + channel`;
- início possui timeout de 60 segundos;
- falha deixa o banco em `DISCONNECTED`, em vez de `OPENING` eterno;
- inicialização geral usa `Promise.allSettled`;
- falha de uma conexão não bloqueia as demais;
- consulta da versão WhatsApp Web é single-flight por processo;
- criação de conexão agora aguarda a inicialização e propaga falhas.

## Semântica dos comandos

- desconectar: aguarda logout, limpa credenciais e grava `DISCONNECTED`;
- regenerar QR: encerra a sessão anterior, limpa o auth state real e inicia uma identidade nova;
- excluir: encerra o socket antes de apagar auth state e registros.

## Compatibilidade

O formato legado `sessions:{whatsappId}:*` continua apenas para leitura/migração e rollback. A primeira leitura válida grava o envelope v2 sem apagar o legado.

## Limitações

Esta versão não conclui todo `REL-002/003`:

- single-flight ainda é local ao processo;
- não existe lease distribuído com fencing;
- `server-cluster.ts` continua inadequado para Baileys e não é usado pelo Docker atual;
- listeners/timers de mensagem, monitor e importação ainda precisam de cleanup central;
- purge ainda depende do mecanismo legado baseado em pattern/`KEYS`;
- batch de Signal keys ainda não possui manifesto/revision atômicos;
- teste real de pareamento, restart e mensagem depende de uma conta canário.

## Próximo lote

Registry completo de sessão, lease Redis, cleanup idempotente, shutdown coordenado, manifesto de auth keys e E2E canário.
