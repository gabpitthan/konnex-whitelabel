# Versão 1.40 — a instalação nova já nasce atendendo

Data: 2026-08-08
Estado: gate aprovado, implantada, instalação do zero verificada

## Por que

A 1.37 corrigiu os sintomas dos três tropeços do primeiro uso real. Faltava a
causa: **a instalação nascia sem setor, sem vínculo da conexão e sem vínculo do
usuário**. Quem instalasse ia repetir os mesmos três tropeços, nessa ordem, nos
primeiros dez minutos — e não teria como saber que precisava ligar três coisas
que nada na tela indica.

## Mudança

**Primeira empresa** (`seeds/20260808120000-create-default-queue.ts`): cria o
setor "Atendimento" e vincula o admin a ele. Idempotente — não faz nada se já
existir setor.

**Toda empresa criada depois** (`CreateCompanyService`): mesmo setor padrão e
mesmo vínculo, dentro da transação que já cria empresa, usuário e configurações.

**Toda conexão criada sem setor escolhido** (`CreateWhatsAppService`): passa a
cair no primeiro setor da empresa em vez de ficar sem nenhum. Escolha explícita
continua respeitada — inclusive a de deixar sem setor.

O nome "Atendimento" é genérico de propósito; quem instala renomeia em Filas.

## Dois defeitos que só o teste encontrou

**1. A criação de empresa quebrou inteira.** `Queue.ativarRoteador` e
`Queue.tempoRoteador` são NOT NULL sem default no modelo. Omiti-los derrubava a
transação com `notNull Violation` — ou seja, minha correção teria impedido
qualquer empresa nova de ser criada. Apareceu ao criar uma empresa de teste pela
API, não na leitura do código.

**2. O vínculo do admin era pulado em silêncio.** No seed, o `rawSelect` que
busca o setor recém-inserido não recebia a transação, então não enxergava a
linha ainda não commitada: o id voltava vazio e o `if (setorId && adminId)`
simplesmente não executava. O setor aparecia, o vínculo não — sem erro nenhum.

O segundo é o mais instrutivo: uma condição que falha em silêncio produz metade
do resultado e nenhuma reclamação.

## Evidência

Instalação completa do zero, em cópia isolada com portas e volumes próprios:

```
✓ Login do administrador funciona
setor        | usuario_vinculado
Atendimento  | Admin
```

E empresa criada pela API de administração, depois da correção dos campos
obrigatórios: setor `Atendimento`, admin `QA` vinculado.

## Limites honestos

- O vínculo **conexão → setor** só acontece quando a conexão é criada. Conexão
  que já existe sem setor continua como está; foi o caso da produção, corrigido
  à mão na 1.37.
- Não há teste automatizado para isso: a verificação foi manual, por instalação
  real. Um teste de seed entraria bem no gate e não foi feito neste lote.

## Rollback

Imagem anterior. O seed é idempotente e o `down` remove apenas o setor criado.
