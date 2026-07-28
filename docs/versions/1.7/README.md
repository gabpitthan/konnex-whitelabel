# Whitelabel Whaticket — versão 1.7

Data: 2026-07-28  
Estado: publicada para validação do usuário

## Objetivo

Estabilizar o frontend, eliminar tela branca silenciosa e substituir a navegação 1.6 por um único menu CRM original e responsivo.

## Escopo

- menu único com ícones;
- subgrupos expansíveis;
- ordem orientada ao uso;
- drawer único no mobile;
- remoção da barra inferior;
- Error Boundary;
- fallback recuperável;
- captura de erros React, `window.error` e `unhandledrejection`;
- endpoint backend sanitizado para observabilidade;
- ID correlacionável por erro.

## Segurança

Logs do navegador não podem conter token, senha, conteúdo de mensagens ou dados pessoais.

## Testes

- preflight da versão: aprovado;
- TypeScript/backend: compilado sem erro;
- frontend: compilado sem erro;
- deploy Docker: aprovado;
- smoke HTTP: frontend ativo e API reportando `1.7`;
- navegador autenticado em `1440×900`: renderização aprovada, sem exceção React e sem overflow horizontal;
- navegador autenticado em `390×844`: renderização aprovada, sem erro de console/rede e sem overflow horizontal;
- Error Boundary: falha real induzida/capturada com ID correlacionável;
- endpoint `/client-errors`: retornou `202`, registrou o ID e removeu Bearer/URL do log.

## Defeitos encontrados durante a revisão

1. **Crítico — tela branca:** o shell chamava `socket.on` antes de o contexto fornecer uma instância Socket.IO. Evidência capturada: `p.on is not a function`. Corrigido nos dois assinantes do layout.
2. **Alto — diagnóstico inexistente:** falhas React apagavam toda a aplicação sem correlação. Corrigido com Error Boundary, captura global e endpoint sanitizado.
3. **Alto — configurações públicas quebradas:** o frontend enviava `token=wtV`, divergente do `ENV_TOKEN`, gerando seis respostas 403 em cada carga. A rota agora é realmente pública e continua limitada pela allowlist do serviço.
4. **Médio — recursos inválidos:** avatar fallback gerava `/undefined/nopicture.png` e o favicon recebia `/public/` duas vezes. Corrigido.
5. **Médio — cache legado:** o service worker antigo podia conservar bundles incompatíveis. Registro foi neutralizado e instalações existentes são removidas.
6. **Médio — pipeline frágil:** bundle principal gzip de aproximadamente 1,68 MB e build entre 5–8 minutos. Source maps e lint foram separados do empacotamento; divisão de bundle permanece dívida.

## Navegação entregue

- um único menu lateral no desktop, recolhível;
- ícones lineares consistentes, sem rail de letras;
- grupos por domínio operacional;
- drawer único no mobile;
- remoção da barra inferior;
- permissões e badges existentes preservados.

## Limitações conhecidas

- o teste desktop registra quatro 401 apenas na carga anônima anterior ao login automático do roteiro; depois do login não reaparecem;
- o projeto legado ainda possui grande volume de avisos ESLint;
- dependências centrais antigas exigem migração controlada: Material UI 4, Sequelize 5, Multer 1 e Puppeteer 19;
- o dashboard já possui composição própria, mas outros módulos internos ainda conservam partes visuais herdadas e serão migrados por domínio.

## Gate reforçado

Gate cumprido com navegador autenticado, console/rede, screenshots desktop/mobile, falha capturada pelo Error Boundary e confirmação do log backend correlacionado.
