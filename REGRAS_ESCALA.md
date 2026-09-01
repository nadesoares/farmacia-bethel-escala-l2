# Regras de Negócio e Diretrizes de Escala - Farmácia Bethel

Este documento contém todas as regras mandatórias do sistema de geração automática de escala da Farmácia Bethel. Nenhuma alteração no código pode desrespeitar ou ignorar estas regras.

---

## 1. Definição do Ciclo Semanal
- **Visão Geral (Público)**:
  - **Início da Semana**: Domingo.
  - **Fim da Semana**: Sábado.
- **Na Página Admin**:
  - **Início da Semana**: Segunda-feira.
  - **Fim da Semana**: Domingo.
- A contagem, trocas de turno e folgas ocorrem estritamente no ciclo de Segunda a Domingo.

---

## 2. Estrutura de Turnos e Regra do 2º Turno
- **1º Turno (Manhã)**: 08:00 às 15:00 (Prioritário)
- **2º Turno (Intermediário)**: 07:00 às 11:00 e 16:00 às 20:00 (Exclusivo para 5 colaboradores)
- **3º Turno (Noite)**: 15:00 às 22:00 (Prioritário)

> 🛑 **REGRA MANDATÓRIA DO 2º TURNO**: O 2º Turno NUNCA é utilizado quando há 1, 2, 3, 4 ou 6 colaboradores (fica sempre vazio `------`). Ele é reservado exclusivamente para equipes de exatamente 5 colaboradores.
> **Exceção Estética**: Também se coloca na Sexta-feira quando houver alguém de folga (`GREEN`), exibindo-o no segundo turno apenas por questão estética, pois ele estará de folga naquele dia.

---

## 3. Matriz de Distribuição por Quantidade de Colaboradores

### Com 1 Colaborador:
- Alterna semanalmente entre o **1º Turno (Manhã)** e o **3º Turno (Noite)**.

### Com 2 Colaboradores:
- **1 no 1º Turno** e **1 no 3º Turno**.
- Alternam de turno semana a semana.
- Final de Semana: 1 trabalha no sábado e folga no domingo; o outro folga no sábado e trabalha no domingo.

### Com 3 Colaboradores (ex: MAURÍCIO, LILIAN, DJANE):
- **Seg a Qui**: 1 no 1º Turno (Manhã) e 2 no 3º Turno (Noite).
- Rodízio contínuo semanal para que todos alternem Manhã e Noite.
- **Sábado**: 2 trabalham (1 T1, 1 T3) e 1 folga.
- **Domingo**: 1 trabalha (quem folgou no sábado) e 2 folgam.
- **Sextas**: Folga verde mensal rodiziada.

### Com 4 Colaboradores:
- **2 no 1º Turno** e **2 no 3º Turno** (2º Turno vazio).
- Grupos de 2 alternam semanalmente entre Manhã e Noite.
- Finais de semana: 2 folgam no sábado e trabalham no domingo; 2 trabalham no sábado e folgam no domingo.

### Com 5 Colaboradores (Caso Único com 2º Turno):
- **2 no 1º Turno**, **1 no 2º Turno (Intermediário)** e **2 no 3º Turno**.

### Com 6 Colaboradores:
- **3 no 1º Turno** e **3 no 3º Turno** (2º Turno vazio).

---

## 4. Regra Mandatória da Folga Verde de Sexta-feira (Folga Mensal Prolongada / `GREEN`)

### 4.1. Relação Sexta-Sábado-Domingo
- **A folga mensal de sexta-feira do colaborador OCORRE OBRIGATORIAMENTE na semana em que ele FOLGA NO SÁBADO e TRABALHA NO DOMINGO**.
- Sequência da semana de folga do colaborador:
  - **Sexta-feira**: Folga Extra Mensal (**VERDE / GREEN**).
  - **Sábado**: Folga Semanal (**OFF**).
  - **Domingo**: Trabalho (**1º ou 3º Turno**).
- 🛑 **É expressamente proibido** atribuir a folga verde da sexta-feira a quem trabalha no sábado.

---

## 5. Rodízio Equitativo (Manhã vs Noite)
- Colaboradores sem preferência de turno **DEVEM alternar semanalmente entre o 1º Turno (Manhã) e o 3º Turno (Noite)**.

---

## 6. Regra Mandatória do FIXO NOITE Seg a Quinta
- Se houver colaborador cadastrado como Fixo Noite Seg-Qui (`NIGHT_WEEKDAY`), este permanece no 3º Turno de Seg-Qui, e os demais alternam o 1º e 3º Turno.

---

## 7. Plantonistas
- Atuam exclusivamente nos dias e turnos cadastrados para plantão (ex: apenas fins de semana).
