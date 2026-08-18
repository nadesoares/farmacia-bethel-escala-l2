# Regras de Negócio e Diretrizes de Escala - Farmácia Bethel

Este documento contém todas as regras mandatórias do sistema de geração automática de escala da Farmácia Bethel. Nenhuma alteração no código pode desrespeitar ou ignorar estas regras.

---

## 1. Definição da Semana
- **Início da Semana**: Segunda-feira.
- **Fim da Semana**: Domingo.
- A contagem e ciclo semanal ocorrem estritamente de Segunda a Domingo.

---

## 2. Estrutura de Turnos e Regra de Uso do 2º Turno
- **1º Turno (Manhã)**: 07:00 às 15:20 (Prioritário)
- **2º Turno (Intermediário)**: 11:40 às 20:00 (**USADO EXCLUSIVAMENTE quando houver exatamente 5 colaboradores**)
- **3º Turno (Noite)**: 14:40 às 23:00 (Prioritário)

> **REGRA MANDATÓRIA DO 2º TURNO**: O 2º Turno NUNCA é utilizado para 1, 2, 3, 4 ou 6 colaboradores. Ele é reservado exclusivamente para o arranjo de 5 colaboradores.

---

## 3. Matriz de Distribuição por Quantidade de Colaboradores

### Com 1 Colaborador:
- Rodízio semanal alternando entre o **1º Turno (Manhã)** e o **3º Turno (Noite)** (2º Turno vazio).

### Com 2 Colaboradores:
- **1 no 1º Turno (Manhã)** e **1 no 3º Turno (Noite)** (2º Turno vazio).
- Alternam de turno semana a semana.
- Fins de semana: 1 trabalha no sábado e folga no domingo; o outro folga no sábado e trabalha no domingo.
- Sextas: Semanas 2 e 3 com folga verde para quem folga no sábado.

### Com 3 Colaboradores (Ex: MAURICIO, LILIAN, RODRIGUES):
- **1 no 1º Turno (Manhã)** e **2 no 3º Turno (Noite)** (2º Turno vazio).
- Rodízio contínuo de 3 semanas para que todos alternem Manhã e Noite.
- Sábado: 2 trabalham (1 no T1, 1 no T3) e 1 folga.
- Domingo: 1 trabalha (quem folgou no sábado) e 2 folgam.
- Sextas: Semanas 2, 3 e 4 com 1 folga verde por semana.

### Com 4 Colaboradores:
- **2 no 1º Turno (Manhã)** e **2 no 3º Turno (Noite)** (2º Turno vazio).
- Grupos de 2 alternam semanalmente entre T1 e T3.
- Fins de semana: 2 trabalham no sábado e folgam no domingo; 2 folgam no sábado e trabalham no domingo.
- Sextas: 1 folga verde em cada uma das 4 semanas.

### Com 5 Colaboradores (Único caso com 2º Turno):
- **2 no 1º Turno (Manhã)**, **1 no 2º Turno (Intermediário)** e **2 no 3º Turno (Noite)**.
- Rodízio semanal abrangendo os 3 turnos.
- Sextas: Nas semanas 2, 3 e 4, até 2 colaboradores ganham folga verde no mesmo dia em turnos diferentes (1 no T1 e 1 no T3), mantendo sempre pelo menos 1 ativo em cada turno e o 2º turno atendido.

### Com 6 Colaboradores:
- **3 no 1º Turno (Manhã)** e **3 no 3º Turno (Noite)** (**2º Turno VAZIO**).
- Dois grupos de 3 alternando semanalmente entre Manhã e Noite.
- Sextas: Nas semanas 2, 3 e 4, até 2 colaboradores ganham folga verde no mesmo dia em turnos diferentes (1 no T1 e 1 no T3), deixando 2 colaboradores ativos trabalhando no T1 e 2 no T3.
- Sáb/Dom: 3 folgam no sábado e trabalham no domingo; 3 trabalham no sábado e folgam no domingo.

---

## 4. Regra Mandatória da Folga de Sexta-feira (Folga Mensal Prolongada / `GREEN`)

### 4.1. Relação Sexta-Sábado-Domingo
- **A folga mensal de sexta-feira do colaborador OCORRE OBRIGATORIAMENTE na semana em que ele FOLGA NO SÁBADO e TRABALHA NO DOMINGO**.
- Sequência da semana de folga do colaborador:
  - **Sexta-feira**: Folga Extra Mensal (**VERDE / GREEN**).
  - **Sábado**: Folga Semanal (**OFF**).
  - **Domingo**: Trabalho (**1º ou 3º Turno**).
- **É expressamente proibido** atribuir a folga verde da sexta-feira a quem trabalha no sábado.

### 4.2. Priorização de Semanas Sem Folga (Dias de Maior Movimento Comercial)
- **1ª Semana do Mês**: Sempre sem folga verde quando há menos colaboradores que semanas ou em equipes de 5/6 colaboradores (maior movimentação no início de mês).
- **4ª Semana do Mês**: Sem folga verde apenas no caso de 2 colaboradores (preservando o fechamento do mês).
- **Semanas 2, 3 e 4**: Concentração das folgas verdes.

---

## 5. Rodízio Equitativo de Horários (Manhã vs Noite)
- Colaboradores com `prefShift === 'NONE'` (sem preferência fixa) **DEVEM alternar semanalmente entre o 1º Turno (Manhã) e o 3º Turno (Noite)**.
- Se houver colaborador com preferência noturna de Seg-Qui (`prefShift === 'NIGHT_WEEKDAY'`), este atua no 3º Turno de Seg-Qui, e os demais alternam o 1º e 3º Turno.

---

## 6. Plantonistas
- Atuam exclusivamente nos dias e turnos selecionados (ex: fins de semana).
