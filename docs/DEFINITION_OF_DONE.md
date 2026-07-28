# Definição de pronto e autoavaliação

Uma tarefa só está pronta quando as respostas aplicáveis forem “sim”:

- O comportamento pedido funciona de verdade, não apenas renderiza?
- Os dados persistem após atualizar a página e reiniciar o serviço?
- Validações críticas também existem no backend?
- Toda operação multiempresa valida `companyId` no servidor?
- Foi testado que uma empresa não acessa dados de outra?
- Caminho feliz e falhas relevantes foram exercitados?
- A mudança preserva autenticação, permissões e compatibilidade?
- O mobile continua utilizável quando a tela é afetada?
- Migration é reversível e tem plano de rollback?
- Nenhum segredo ou dado pessoal entrou no Git ou nos logs?
- Build, testes e smoke aplicáveis passaram?
- O deploy executa a versão documentada?
- Memória e documentação descrevem o estado real?
- Limitações restantes estão explícitas?
- A validação foi além de build e HTTP 200?
- O fluxo autenticado foi exercitado em navegador real?
- Console, erros de página e requisições foram inspecionados?
- Há evidência visual desktop e mobile das áreas alteradas?
- Foram realizadas revisões funcional, UX e regressiva separadamente?
- A entrega transforma realmente a funcionalidade ou apenas aplica tema?
- Existe um Evidence Pack proporcional ao risco?
- A entrega documenta como ainda pode falhar?
- Fatos, inferências e itens não testados estão separados?

## Revisão do diff

Antes do commit:

1. conferir `git diff --check`;
2. procurar código temporário, logs sensíveis e credenciais;
3. conferir consultas sem escopo de tenant;
4. conferir tratamento de erro e estados de carregamento;
5. conferir compatibilidade de API e banco;
6. registrar os comandos realmente executados.

## Autoavaliação em três passagens

### 1. Funcional

- Exercitar dados reais ou demonstração isolada.
- Confirmar rotas, APIs, permissões, erros e persistência.
- Atualizar e reabrir a página.

### 2. UX

- Executar a tarefa como usuário, não apenas inspecionar componentes.
- Contar cliques, conferir próxima ação, scroll, teclado, fechamento e salvamento.
- Avaliar identidade e coerência com o restante do CRM.

### 3. Regressão

- Login autenticado.
- Console e `pageerror` sem falhas novas.
- Rede sem erros inesperados.
- Desktop, tablet e mobile.
- Tema claro/escuro e perfis aplicáveis.
- Fallback de erro induzido quando houver mudanças de observabilidade.

## Gate numérico

Aplicar a matriz 0–2 de `docs/JARVIS_ENGINEERING_SYSTEM.md`. Nota `0` em corretude, persistência/integridade, auth/tenant, runtime real ou deploy/rollback impede declarar a tarefa concluída.
