# Política de versões e snapshots

## Modelo

O projeto usa versões no formato `MAIOR.SUBVERSÃO`.

- `1.1`: primeiro lote funcional documentado da versão 1.
- `1.2`, `1.3`, ...: lotes seguintes de correções e desenvolvimento.
- Uma subversão representa um lote coerente, testado e commitado; não cada arquivo editado.
- O número maior representa um ciclo aprovado pelo usuário.

Exemplo:

1. Desenvolvimento em `1.1`.
2. Novo lote incrementa para `1.2`.
3. Novo lote incrementa para `1.3`.
4. Usuário declara “a versão está pronta”.
5. É criado o snapshot imutável `versao-1.3`.
6. O próximo ciclo começa em `2.1`.

## Estados

- `em desenvolvimento`: pode receber mudanças.
- `candidata`: funcionalidades concluídas, em validação.
- `pronta`: declarada explicitamente pelo usuário e arquivada.

## Conteúdo de uma subversão

Cada subversão deve registrar:

- objetivo;
- funcionalidades e correções;
- arquivos e arquitetura afetados;
- alterações de banco;
- impactos multiempresa;
- testes executados e resultados;
- problemas conhecidos;
- instruções de deploy e rollback;
- commit Git.

## Snapshot completo

Destino:

`/root/whitelabel-whaticket-versions/versao-X.Y/`

Arquivos:

- `whitelabel-whaticket-X.Y.tar.gz`: código-fonte rastreado no Git;
- `MANIFEST.md`: versão, commit, data, branch e contexto operacional;
- `RELEASE_NOTES.md`: cópia das notas da versão;
- `SHA256SUMS`: checksum do arquivo.

O snapshot é criado a partir de um commit Git, garantindo conteúdo reproduzível.

## Dados deliberadamente excluídos

- `.env`;
- `credentials.txt`;
- certificados e chaves privadas;
- dumps de banco e dados de clientes;
- uploads e logs;
- `node_modules`, builds e caches;
- diretório `.git`.

Esses dados pertencem à operação, não ao código de uma versão. Backups operacionais serão tratados por uma política separada e protegida.

## Rollback

1. Identificar o snapshot e commit no `MANIFEST.md`.
2. Preservar banco e uploads atuais.
3. Restaurar o código em diretório de staging.
4. Conferir compatibilidade das migrations.
5. Construir imagens novas a partir do snapshot.
6. Testar antes de substituir containers.

Nunca restaurar código antigo sobre o diretório ativo sem staging e validação.
