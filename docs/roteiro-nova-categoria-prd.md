# Roteiro de reunião — Nova categoria de PRD

Guia para conduzir a reunião com a equipe e reunir **tudo** o que é preciso para construir uma
categoria nova de PRD (ex.: **Merenda**, Prestação de Serviço, Aquisições…). Preencha durante a
conversa e me entregue preenchido — com isso eu monto a categoria.

> **Dica de ouro:** traga **2 ou 3 PRDs reais já prontos** dessa categoria (o texto final) + os
> dados que geraram cada um. Exemplo real vale mais que mil explicações — com ele eu monto o modelo
> de trás pra frente e ainda crio testes automáticos que pegam casos de borda.

Como funcionam os marcadores no texto (usados na seção 2):

| Marcador | Significado | Onde é preenchido |
|---|---|---|
| `<<campo>>` | muda **todo mês** | digitado na hora de gerar o PRD |
| `{campo}` | **fixo do contrato/fornecedor** | cadastrado uma vez |

---

## 0. Preparação (antes da reunião)
- [ ] 2–3 PRDs reais dessa categoria (texto final).
- [ ] 1 contrato/processo de exemplo com todos os dados.
- [ ] Quem entende a regra de negócio dessa categoria está na sala?

## 1. Identificação da categoria
- **Nome da categoria:** ____________________ (ex.: Merenda)
- **Em uma frase, o que é / quando se usa este PRD:** ____________________
- **Com que frequência é gerado?** ( ) mensal ( ) outro: ______

## 2. Texto padrão (o coração do modelo)
Cole aqui o texto **exato** de um PRD real desta categoria:

```
(cole o texto aqui)
```

Agora marquem no texto acima:
- O que **muda todo mês** → vira `<<campo>>`.
- O que é **fixo do contrato/fornecedor** → vira `{campo}`.

## 3. Campos que mudam a cada PRD (mensais `<<>>`)
Liste cada um:

| Marcador | Rótulo amigável | Exemplo | Formato/observação |
|---|---|---|---|
| `<<____>>` | ____________ | ______ | ______ |
| `<<____>>` | ____________ | ______ | ______ |

## 4. Campos fixos (cadastrados uma vez — contrato/fornecedor `{}`)
Liste cada um:

| Marcador | Rótulo amigável | Exemplo | Tipo (curto / texto longo) |
|---|---|---|---|
| `{____}` | ____________ | ______ | ______ |
| `{____}` | ____________ | ______ | ______ |

## 5. Variações / regras condicionais (formato SE → ENTÃO)
Alguma parte do texto muda dependendo de uma condição do contrato? Escreva assim:

> SE [condição] ENTÃO [o que muda no texto]

- SE ____________________ ENTÃO ____________________
- SE ____________________ ENTÃO ____________________

*(Ex. da Locação: SE o contrato não tem termo aditivo ENTÃO o trecho do termo aditivo some.)*

## 6. Formatos especiais / observações
- **Datas:** formato aceito? (ex.: DD/MM/AAAA, DD/mês) ____________
- **Valores/moeda:** ____________
- **Algum campo é derivado de outro?** ____________
- **Outras observações:** ____________

## 7. Precisa de algum CÁLCULO? (não esquecer!)
Esta categoria envolve alguma conta? (ex.: valor por refeição, per capita, quantidade × preço
unitário, proporcional a dias, desconto, imposto…)

- [ ] **Não** — só texto.
- [ ] **Sim** — descreva:
  - **O que se calcula:** ____________________
  - **Fórmula, passo a passo:** ____________________
  - **Arredondamento?** (pra cima/baixo, quantas casas) ____________
  - **Quais valores o usuário digita vs. vêm do cadastro:** ____________
  - **Exemplo numérico completo** (com os números batendo, como fizemos na Calculadora de Locação):
    ```
    (ex.: valor por refeição = ...; total = ...)
    ```

## 8. Prazos / vigência
- **Precisa controlar a vigência do contrato** (avisar quando está vencendo/expirado)? ( ) sim ( ) não
- Se sim, com quantos dias de antecedência avisar? ______
- Contrato expirado deve **bloquear** ou só **avisar**? ____________

## 9. Quem usa
- Geralmente: **usuário comum** gera o PRD; **admin** cadastra contratos/modelos. Muda algo aqui? ____

## 10. Exemplos reais (2–3) — o mais importante
Para cada um, o **texto final do PRD** + os dados que geraram:

```
Exemplo 1 (texto): ...
Dados usados: ...

Exemplo 2 (texto): ...
Dados usados: ...
```

---

## Checklist de fechamento (confira antes de me entregar)
- [ ] Texto padrão coletado (seção 2)
- [ ] Campos mensais e fixos separados (seções 3 e 4)
- [ ] Regras condicionais em SE → ENTÃO (seção 5)
- [ ] Cálculo com fórmula + exemplo numérico, **se houver** (seção 7)
- [ ] Vigência definida (seção 8)
- [ ] 2–3 exemplos reais (seção 10)

### O que eu faço com isto (referência)
Ao receber a ficha, classifico cada item em: **A** – marcador simples (sem código); **B** –
condicional já suportada (sem código); **C** – regra/cálculo novo (ajuste no código + testes).
Cálculos e regras muito específicas são **C**. Este roteiro expande a versão simples em
[`ficha-tipo-prd.md`](./ficha-tipo-prd.md).
