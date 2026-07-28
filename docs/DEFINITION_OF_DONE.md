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

## Revisão do diff

Antes do commit:

1. conferir `git diff --check`;
2. procurar código temporário, logs sensíveis e credenciais;
3. conferir consultas sem escopo de tenant;
4. conferir tratamento de erro e estados de carregamento;
5. conferir compatibilidade de API e banco;
6. registrar os comandos realmente executados.
