/**
 * SCHEDULER.JS - Motor da Farmácia: Escala 6x1 Dinâmica com Prioridade nos Turnos 1 e 3
 * 
 * Regras:
 * 1. Priorização de Turnos: Turno 1 (Manhã) e Turno 3 (Noite) são prioridades.
 *    - 3 funcionários: Turno 1 (1), Turno 2 (1), Turno 3 (1)
 *    - 4 funcionários: Turno 1 (2), Turno 2 (0), Turno 3 (2)
 *    - 5 funcionários: Turno 1 (2), Turno 2 (1), Turno 3 (2)
 *    - 6 funcionários: Turno 1 (2), Turno 2 (2), Turno 3 (2)
 * 2. Escala 6x1: Todo colaborador folga 1 dia por semana (rodízio Sábado/Domingo).
 * 3. CLT Domingos: Todo colaborador folga pelo menos 1 Domingo por mês.
 * 4. Folga Mensal Extra (Final de Semana Prolongado):
 *    - Se a folga semanal for Sábado -> Folga extra na Sexta (Sex + Sáb OFF).
 *    - Se a folga semanal for Domingo -> Folga extra na Segunda (Dom + Seg OFF).
 *    - A folga extra semanal é destacada em VERDE (GREEN).
 */

/**
 * SCHEDULER.JS - Motor da Farmácia: Escala 6x1 Fiel à Imagem 3
 */

class PharmacyScheduler {
  constructor(store) {
    this.store = store;
  }

  generateMonthSchedule(year, month) {
    const yearMonthKey = `${year}-${String(month).padStart(2, '0')}`;
    const rawActiveEmployees = this.store.getMonthEmployees(yearMonthKey);
    const selectedEmployeeIds = this.store.getMonthSelectedEmployeeIds(yearMonthKey);
    if (rawActiveEmployees.length === 0) {
      throw new Error('Nenhum funcionário ativo selecionado para a escala deste mês.');
    }

    // 1. Deduplica funcionários por nome sanitizado
    const uniqueEmployeesMap = new Map();
    rawActiveEmployees.forEach(emp => {
      const cleanName = (emp.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
      if (cleanName && !uniqueEmployeesMap.has(cleanName)) {
        uniqueEmployeesMap.set(cleanName, { ...emp, name: (emp.name || '').trim().toUpperCase() });
      }
    });

    const activeEmployees = Array.from(uniqueEmployeesMap.values());
    const fullTimeEmps = activeEmployees.filter(e => e.prefShift !== 'PLANTONISTA');
    const plantonistas = activeEmployees.filter(e => e.prefShift === 'PLANTONISTA');
    let empsList = fullTimeEmps.length > 0 ? fullTimeEmps : activeEmployees;

    // Pareamento L2 de Novato + Experiente quando há 4 balconistas
    if (empsList.length === 4) {
      const novatos = empsList.filter(e => {
        const n = (e.name || '').toUpperCase();
        return n.includes('LIVIA') || n.includes('LÍVIA') || n.includes('MATHEUS');
      });
      const experientes = empsList.filter(e => !novatos.includes(e));
      if (novatos.length === 2 && experientes.length === 2) {
        empsList = [novatos[0], experientes[0], novatos[1], experientes[1]];
      }
    }
    const numEmps = empsList.length;

    const daysInMonth = new Date(year, month, 0).getDate();
    const daysSchedule = {};

    // Identifica todas as sextas-feiras do mês
    const fridaysInMonth = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month - 1, d);
      if (dt.getDay() === 5) {
        fridaysInMonth.push(d);
      }
    }

    const numFridays = fridaysInMonth.length;

    // Regra de Priorização de Semanas para Folgas de Sexta:
    // - 2 colaboradores em 4 semanas: semanas 2 e 3 (índices 1, 2) -> 1ª e 4ª semana sem folga.
    // - 3 colaboradores em 4 semanas: semanas 2, 3 e 4 (índices 1, 2, 3) -> 1ª semana sem folga.
    // - 4 colaboradores em 4 semanas: todas as 4 semanas (índices 0, 1, 2, 3).
    // - 4 colaboradores em 5 semanas: semanas 2, 3, 4 e 5 (índices 1, 2, 3, 4) -> 1ª semana sem folga.
    // - 5 ou 6 colaboradores: 1ª semana sem folga verde (maior movimento de início de mês), folgas nas semanas 2, 3, 4 (e 5).
    // Define as sextas-feiras candidatas para receber folga verde
    // REGRA AUTÔNOMA L2:
    // Se numFridays === numEmps (ex: 4 sextas para 4 balconistas):
    //   Todas as sextas recebem 1 folga (índices [0, 1, 2, 3]).
    // Se numFridays > numEmps (ex: 5 sextas para 4 balconistas, ou 4 sextas para 3 balconistas):
    //   A 1ª sexta é priorizada a NÃO dar folga (início de mês/pico), folgas distribuídas a partir da 2ª semana (índices [1, 2, 3, ...]).
    let candidateFridayIndices = [];
    if (numFridays === numEmps) {
      candidateFridayIndices = Array.from({ length: numFridays }, (_, i) => i);
    } else if (numFridays > numEmps) {
      candidateFridayIndices = Array.from({ length: Math.min(numEmps, numFridays - 1) }, (_, i) => i + 1);
    } else {
      candidateFridayIndices = Array.from({ length: numFridays }, (_, i) => i);
    }

    // Âncora perpétua: Segunda-feira 24/08/2026 (Matriz Universal Fixa de 24 a 31 de Agosto)
    const epochMonday = new Date(2026, 7, 24);

    // Identifica se há alguém com preferência explícita de noite de Seg-Qui
    const explicitNightEmp = empsList.find(e => e.prefShift === 'NIGHT_WEEKDAY');

    // ====================================================================
    // MAPEAMENTO DE FOLGA VERDE (SEXTA-FEIRA) - GARANTIA: TODO FUNCIONÁRIO
    // RECEBE EXATAMENTE 1 FOLGA VERDE POR MÊS.
    // ====================================================================
    const fridayOffMap = {}; // fDay -> Set of greenEmpNames
    const assignedGreenEmployees = new Set();
    const maxGreensPerFriday = (numEmps >= 5) ? 2 : 1;

    // Inicializa todas as sextas com Sets vazios
    fridaysInMonth.forEach(fDay => { fridayOffMap[fDay] = new Set(); });

    // --- PASSO 1: Para cada sexta candidata, determina quem folga no sábado
    //     e atribui folga verde apenas a quem AINDA NÃO recebeu. ---
    candidateFridayIndices.forEach(fIdx => {
      const fDay = fridaysInMonth[fIdx];
      const mondayDate = new Date(year, month - 1, fDay - 4);
      const daysDiff = Math.round((mondayDate - epochMonday) / (24 * 60 * 60 * 1000));
      const globalWeekIdx = Math.floor(daysDiff / 7);
      const mod3 = ((globalWeekIdx % 3) + 3) % 3;
      const mod4 = ((globalWeekIdx % 4) + 4) % 4;
      const isEvenWeek = (globalWeekIdx % 2 === 0);

      // Determina TODOS os funcionários que FOLGAM no sábado dessa semana
      let satOffEmps = [];
      if (numEmps === 1) {
        // 1 func: folga sábado em semanas ÍMPARES (trabalha domingo)
        satOffEmps = !isEvenWeek ? [empsList[0]] : [];
      } else if (numEmps === 2) {
        satOffEmps = [isEvenWeek ? empsList[0] : empsList[1]];
      } else if (numEmps === 3) {
        if (explicitNightEmp) {
          const rotEmps = empsList.filter(e => e !== explicitNightEmp);
          const rotEmp1 = rotEmps[0] || empsList[0];
          const rotEmp2 = rotEmps[1] || empsList[1];
          satOffEmps = [(mod4 === 0 || mod4 === 3) ? explicitNightEmp : (mod4 === 1 ? rotEmp2 : rotEmp1)];
        } else {
          satOffEmps = [empsList[mod3]];
        }
      } else if (numEmps === 4) {
        const novatoM = empsList.find(e => (e.name || '').toUpperCase().includes('MATHEUS')) || empsList[0];
        const novataF = empsList.find(e => ((e.name || '').toUpperCase().includes('LIVIA') || (e.name || '').toUpperCase().includes('LÍVIA'))) || empsList[1];
        const expSalete = empsList.find(e => (e.name || '').toUpperCase().includes('SALETE')) || empsList[2];
        const expNatalia = empsList.find(e => ((e.name || '').toUpperCase().includes('NATALIA') || (e.name || '').toUpperCase().includes('NATÁLIA'))) || empsList[3];

        if (mod4 === 0) satOffEmps = [novataF, expNatalia];
        else if (mod4 === 1) satOffEmps = [novatoM, expNatalia];
        else if (mod4 === 2) satOffEmps = [novataF, expSalete];
        else satOffEmps = [novatoM, expSalete];
      } else if (numEmps === 5) {
        const w3 = empsList[(3 + globalWeekIdx * 2) % 5];
        const w4 = empsList[(4 + globalWeekIdx * 2) % 5];
        satOffEmps = [w3, w4];
      } else {
        const half = Math.ceil(numEmps / 2);
        satOffEmps = isEvenWeek ? empsList.slice(half) : empsList.slice(0, half);
      }

      // Atribui verde a quem AINDA NÃO recebeu, respeitando o limite por sexta
      let assigned = 0;
      satOffEmps.forEach(emp => {
        if (emp && assigned < maxGreensPerFriday && !assignedGreenEmployees.has(emp.name)) {
          fridayOffMap[fDay].add(emp.name);
          assignedGreenEmployees.add(emp.name);
          assigned++;
        }
      });
    });

    // --- PASSO 2: GARANTIA - qualquer funcionário que AINDA não recebeu folga verde
    //     é forçado a receber numa sexta candidata disponível. ---
    empsList.forEach(emp => {
      if (!assignedGreenEmployees.has(emp.name)) {
        for (const fIdx of candidateFridayIndices) {
          const fDay = fridaysInMonth[fIdx];
          if (fridayOffMap[fDay].size < maxGreensPerFriday) {
            fridayOffMap[fDay].add(emp.name);
            assignedGreenEmployees.add(emp.name);
            break;
          }
        }
        if (!assignedGreenEmployees.has(emp.name)) {
          for (const fIdx of candidateFridayIndices) {
            const fDay = fridaysInMonth[fIdx];
            fridayOffMap[fDay].add(emp.name);
            assignedGreenEmployees.add(emp.name);
            break;
          }
        }
      }
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay(); // 0=Dom, 1=Seg, ..., 5=Sex, 6=Sáb
      const dayKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const slots = [[], [], []];

      // Determina a semana global contínua (Segunda a Domingo)
      const diffToMon = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
      const mondayDate = new Date(year, month - 1, day - diffToMon);
      const daysDiff = Math.round((mondayDate - epochMonday) / (24 * 60 * 60 * 1000));
      const globalWeekIdx = Math.floor(daysDiff / 7);
      const mod3 = ((globalWeekIdx % 3) + 3) % 3;
      const mod4 = ((globalWeekIdx % 4) + 4) % 4;
      const isEvenWeek = (globalWeekIdx % 2 === 0);

      if (numEmps === 1) {
        // ==========================================
        // --- CASO 1 FUNCIONÁRIO ---
        // Alterna: Semana Par → T1 + trabalha Sáb + folga Dom
        //          Semana Ímpar → T3 + folga Sáb + trabalha Dom (GREEN na Sexta)
        // ==========================================
        const emp = empsList[0];
        const sIdx = isEvenWeek ? 0 : 2;
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          const isGreen = (dayOfWeek === 5 && fridayOffMap[day] && fridayOffMap[day].has(emp.name));
          slots[sIdx].push({ employeeName: emp.name, color: isGreen ? 'GREEN' : 'NORMAL' });
        } else if (dayOfWeek === 6) {
          // Sábado: trabalha em semanas pares, folga em ímpares
          if (isEvenWeek) {
            slots[sIdx].push({ employeeName: emp.name, color: 'RED' });
          }
        } else if (dayOfWeek === 0) {
          // Domingo: trabalha em semanas ímpares (folgou sábado), folga em pares
          if (!isEvenWeek) {
            slots[sIdx].push({ employeeName: emp.name, color: 'RED' });
          }
        }


      } else if (numEmps === 2) {
        // ==========================================
        // --- CASO 2 FUNCIONÁRIOS (1 NO T1, 1 NO T3) ---
        // ==========================================
        const empA = empsList[0];
        const empB = empsList[1];
        const hasGreen = fridayOffMap[day] && fridayOffMap[day].size > 0;

        if (dayOfWeek >= 1 && dayOfWeek <= 4) {
          const t1 = isEvenWeek ? empA : empB;
          const t3 = isEvenWeek ? empB : empA;
          slots[0].push({ employeeName: t1.name, color: 'NORMAL' });
          slots[2].push({ employeeName: t3.name, color: 'NORMAL' });

        } else if (dayOfWeek === 5) {
          if (hasGreen) {
            const greenEmpName = Array.from(fridayOffMap[day])[0];
            const greenWorker = (empA.name === greenEmpName) ? empA : empB;
            const otherWorker = (empA.name === greenEmpName) ? empB : empA;
            slots[0].push({ employeeName: greenWorker.name, color: 'GREEN' });
            slots[2].push({ employeeName: otherWorker.name, color: 'NORMAL' });
          } else {
            const t1 = isEvenWeek ? empA : empB;
            const t3 = isEvenWeek ? empB : empA;
            slots[0].push({ employeeName: t1.name, color: 'NORMAL' });
            slots[2].push({ employeeName: t3.name, color: 'NORMAL' });
          }

        } else if (dayOfWeek === 6) {
          if (isEvenWeek) {
            const sIdx = (mod4 === 0) ? 2 : 0;
            slots[sIdx].push({ employeeName: empB.name, color: 'RED' });
          } else {
            const sIdx = (mod4 === 1) ? 2 : 0;
            slots[sIdx].push({ employeeName: empA.name, color: 'RED' });
          }

        } else if (dayOfWeek === 0) {
          if (isEvenWeek) {
            const sIdx = (mod4 === 0) ? 0 : 2;
            slots[sIdx].push({ employeeName: empA.name, color: 'RED' });
          } else {
            const sIdx = (mod4 === 1) ? 0 : 2;
            slots[sIdx].push({ employeeName: empB.name, color: 'RED' });
          }
        }

      } else if (numEmps === 3) {
        // ==========================================
        // --- CASO 3 FUNCIONÁRIOS (1 NO T1, 2 NO T3) ---
        // ==========================================
        if (explicitNightEmp) {
          const rotEmps = empsList.filter(e => e !== explicitNightEmp);
          const rotEmp1 = rotEmps[0] || empsList[0];
          const rotEmp2 = rotEmps[1] || empsList[1];

          if (dayOfWeek >= 1 && dayOfWeek <= 4) {
            if (mod4 === 0 || mod4 === 2) {
              slots[0].push({ employeeName: rotEmp2.name, color: 'NORMAL' });
              slots[2].push({ employeeName: explicitNightEmp.name, color: 'NORMAL' });
              slots[2].push({ employeeName: rotEmp1.name, color: 'NORMAL' });
            } else {
              slots[0].push({ employeeName: rotEmp1.name, color: 'NORMAL' });
              slots[2].push({ employeeName: explicitNightEmp.name, color: 'NORMAL' });
              slots[2].push({ employeeName: rotEmp2.name, color: 'NORMAL' });
            }
          } else if (dayOfWeek === 5) {
            const hasGreen = fridayOffMap[day] && fridayOffMap[day].size > 0;
            if (hasGreen) {
              const greenEmpName = Array.from(fridayOffMap[day])[0];
              const workingEmps = empsList.filter(e => e.name !== greenEmpName);
              if (workingEmps[0]) slots[0].push({ employeeName: workingEmps[0].name, color: 'NORMAL' });
              slots[1].push({ employeeName: greenEmpName, color: 'GREEN' });
              if (workingEmps[1]) slots[2].push({ employeeName: workingEmps[1].name, color: 'NORMAL' });
            } else {
              slots[0].push({ employeeName: explicitNightEmp.name, color: 'NORMAL' });
              slots[2].push({ employeeName: rotEmp1.name, color: 'NORMAL' });
              slots[2].push({ employeeName: rotEmp2.name, color: 'NORMAL' });
            }
          } else if (dayOfWeek === 6) {
            if (mod4 === 0) {
              slots[0].push({ employeeName: rotEmp1.name, color: 'RED' });
              slots[2].push({ employeeName: rotEmp2.name, color: 'RED' });
            } else if (mod4 === 1) {
              slots[0].push({ employeeName: explicitNightEmp.name, color: 'RED' });
              slots[2].push({ employeeName: rotEmp1.name, color: 'RED' });
            } else if (mod4 === 2) {
              slots[2].push({ employeeName: rotEmp2.name, color: 'RED' });
              slots[2].push({ employeeName: explicitNightEmp.name, color: 'RED' });
            } else {
              slots[2].push({ employeeName: rotEmp1.name, color: 'RED' });
              slots[0].push({ employeeName: rotEmp2.name, color: 'RED' });
            }
          } else if (dayOfWeek === 0) {
            if (mod4 === 0 || mod4 === 3) {
              slots[0].push({ employeeName: explicitNightEmp.name, color: 'RED' });
            } else if (mod4 === 1) {
              slots[0].push({ employeeName: rotEmp2.name, color: 'RED' });
            } else {
              slots[0].push({ employeeName: rotEmp1.name, color: 'RED' });
            }
          }
        } else {
          // Sem preferência fixa: RODÍZIO TOTAL EQUITATIVO DE TODOS OS 3 FUNCIONÁRIOS
          const satOffEmp = empsList[mod3]; // Folga no Sábado e trabalha no Domingo
          const satWork1 = empsList[(mod3 + 1) % 3];
          const satWork2 = empsList[(mod3 + 2) % 3];

          if (dayOfWeek >= 1 && dayOfWeek <= 4) {
            slots[0].push({ employeeName: satOffEmp.name, color: 'NORMAL' });
            slots[2].push({ employeeName: satWork1.name, color: 'NORMAL' });
            slots[2].push({ employeeName: satWork2.name, color: 'NORMAL' });

          } else if (dayOfWeek === 5) {
            const hasGreen = fridayOffMap[day] && fridayOffMap[day].has(satOffEmp.name);
            if (hasGreen) {
              slots[0].push({ employeeName: satWork1.name, color: 'NORMAL' });
              slots[1].push({ employeeName: satOffEmp.name, color: 'GREEN' });
              slots[2].push({ employeeName: satWork2.name, color: 'NORMAL' });
            } else {
              slots[0].push({ employeeName: satOffEmp.name, color: 'NORMAL' });
              slots[0].push({ employeeName: satWork1.name, color: 'NORMAL' });
              slots[2].push({ employeeName: satWork2.name, color: 'NORMAL' });
            }

          } else if (dayOfWeek === 6) {
            // Sábado: os outros 2 trabalham (1 no T1, 1 no T3) e satOffEmp FOLGA
            slots[0].push({ employeeName: satWork1.name, color: 'RED' });
            slots[2].push({ employeeName: satWork2.name, color: 'RED' });

          } else if (dayOfWeek === 0) {
            // Domingo: quem folgou no sábado trabalha no Domingo
            slots[0].push({ employeeName: satOffEmp.name, color: 'RED' });
          }
        }

      } else if (numEmps === 4) {
        // ==========================================
        // --- CASO 4 FUNCIONÁRIOS (2 NO T1, 2 NO T3, T2 VAZIO) ---
        // REGRA DE ALTERNÂNCIA E PRIORIZAÇÃO DA NOITE:
        // - Alternância semanal contínua de turnos (T1 na semana N -> T3 na semana N+1).
        // - Prioridade no Turno da Noite (T3) para homens (MATHEUS) em eventuais repetições.
        // ==========================================
        const novatoM = empsList.find(e => (e.name || '').toUpperCase().includes('MATHEUS')) || empsList[0];
        const novataF = empsList.find(e => ((e.name || '').toUpperCase().includes('LIVIA') || (e.name || '').toUpperCase().includes('LÍVIA'))) || empsList[1];
        const expSalete = empsList.find(e => (e.name || '').toUpperCase().includes('SALETE')) || empsList[2];
        const expNatalia = empsList.find(e => ((e.name || '').toUpperCase().includes('NATALIA') || (e.name || '').toUpperCase().includes('NATÁLIA'))) || empsList[3];

        let t1Group, t3Group;
        if (mod4 === 0) {
          t1Group = [novataF, expNatalia]; // LÍVIA + NATÁLIA (Semana 24 a 28/08)
          t3Group = [novatoM, expSalete]; // MATHEUS + SALETE
        } else if (mod4 === 1) {
          t1Group = [novatoM, expSalete]; // MATHEUS + SALETE (Semana 31/08 a 04/09)
          t3Group = [novataF, expNatalia]; // LÍVIA + NATÁLIA
        } else if (mod4 === 2) {
          t1Group = [novataF, expSalete]; // LÍVIA + SALETE
          t3Group = [novatoM, expNatalia]; // MATHEUS + NATÁLIA
        } else {
          t1Group = [novatoM, expNatalia]; // MATHEUS + NATÁLIA
          t3Group = [novataF, expSalete]; // LÍVIA + SALETE
        }

        if (dayOfWeek >= 1 && dayOfWeek <= 4) {
          t1Group.forEach(e => slots[0].push({ employeeName: e.name, color: 'NORMAL' }));
          t3Group.forEach(e => slots[2].push({ employeeName: e.name, color: 'NORMAL' }));

        } else if (dayOfWeek === 5) {
          t1Group.forEach(e => {
            const isGreen = fridayOffMap[day] && fridayOffMap[day].has(e.name);
            if (isGreen) {
              slots[1].push({ employeeName: e.name, color: 'GREEN' });
            } else {
              slots[0].push({ employeeName: e.name, color: 'NORMAL' });
            }
          });
          t3Group.forEach(e => {
            const isGreen = fridayOffMap[day] && fridayOffMap[day].has(e.name);
            if (isGreen) {
              slots[1].push({ employeeName: e.name, color: 'GREEN' });
            } else {
              slots[2].push({ employeeName: e.name, color: 'NORMAL' });
            }
          });

        } else if (dayOfWeek === 6) {
          let satT1, satT3;
          if (mod4 === 0) {
            satT1 = expSalete;
            satT3 = novatoM;
          } else if (mod4 === 1) {
            satT1 = expSalete;
            satT3 = novataF;
          } else if (mod4 === 2) {
            satT1 = expNatalia;
            satT3 = novatoM;
          } else {
            satT1 = expNatalia;
            satT3 = novataF;
          }
          slots[0].push({ employeeName: satT1.name, color: 'RED' });
          slots[2].push({ employeeName: satT3.name, color: 'RED' });

        } else if (dayOfWeek === 0) {
          let sunT1, sunT3;
          if (mod4 === 0) {
            sunT1 = expNatalia;
            sunT3 = novataF;
          } else if (mod4 === 1) {
            sunT1 = expNatalia;
            sunT3 = novatoM;
          } else if (mod4 === 2) {
            sunT1 = expSalete;
            sunT3 = novataF;
          } else {
            sunT1 = expSalete;
            sunT3 = novatoM;
          }
          slots[0].push({ employeeName: sunT1.name, color: 'RED' });
          slots[2].push({ employeeName: sunT3.name, color: 'RED' });
        }

      } else if (numEmps === 5) {
        // ==========================================
        // --- CASO 5 FUNCIONÁRIOS (ÚNICO CASO COM 2º TURNO: 2 NO T1, 1 NO T2, 2 NO T3) ---
        // ==========================================
        const baseShiftMap = [0, 0, 1, 2, 2];

        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          empsList.forEach((emp, empIdx) => {
            let sIdx = baseShiftMap[(empIdx + globalWeekIdx) % 5];
            const isGreen = (dayOfWeek === 5 && fridayOffMap[day] && fridayOffMap[day].has(emp.name));
            slots[sIdx].push({ employeeName: emp.name, color: isGreen ? 'GREEN' : 'NORMAL' });
          });
        } else if (dayOfWeek === 6) {
          const w0 = empsList[(0 + globalWeekIdx * 2) % 5];
          const w1 = empsList[(1 + globalWeekIdx * 2) % 5];
          const w2 = empsList[(2 + globalWeekIdx * 2) % 5];
          slots[0].push({ employeeName: w0.name, color: 'RED' });
          slots[1].push({ employeeName: w1.name, color: 'RED' });
          slots[2].push({ employeeName: w2.name, color: 'RED' });
        } else if (dayOfWeek === 0) {
          const w3 = empsList[(3 + globalWeekIdx * 2) % 5];
          const w4 = empsList[(4 + globalWeekIdx * 2) % 5];
          slots[0].push({ employeeName: w3.name, color: 'RED' });
          slots[2].push({ employeeName: w4.name, color: 'RED' });
        }

      } else {
        // ==========================================
        // --- CASO 6 OU MAIS FUNCIONÁRIOS (3 NO T1, 3 NO T3, T2 VAZIO) ---
        // ==========================================
        const half = Math.ceil(numEmps / 2);
        const groupA = empsList.slice(0, half);
        const groupB = empsList.slice(half);

        if (dayOfWeek >= 1 && dayOfWeek <= 4) {
          const t1Group = isEvenWeek ? groupA : groupB;
          const t3Group = isEvenWeek ? groupB : groupA;
          t1Group.forEach(e => slots[0].push({ employeeName: e.name, color: 'NORMAL' }));
          t3Group.forEach(e => slots[2].push({ employeeName: e.name, color: 'NORMAL' }));

        } else if (dayOfWeek === 5) {
          const t1Group = isEvenWeek ? groupB : groupA;
          const t3Group = isEvenWeek ? groupA : groupB;

          t1Group.forEach(e => {
            const isGreen = fridayOffMap[day] && fridayOffMap[day].has(e.name);
            slots[0].push({ employeeName: e.name, color: isGreen ? 'GREEN' : 'NORMAL' });
          });
          t3Group.forEach(e => {
            const isGreen = fridayOffMap[day] && fridayOffMap[day].has(e.name);
            slots[2].push({ employeeName: e.name, color: isGreen ? 'GREEN' : 'NORMAL' });
          });

        } else if (dayOfWeek === 6) {
          const satGroup = isEvenWeek ? groupA : groupB;
          // Distribui entre 1º e 3º Turnos (2 no T1, 1 no T3 ou proporcional)
          const satT1Count = Math.ceil(satGroup.length / 2);
          satGroup.forEach((e, idx) => {
            const sIdx = (idx < satT1Count) ? 0 : 2;
            slots[sIdx].push({ employeeName: e.name, color: 'RED' });
          });

        } else if (dayOfWeek === 0) {
          const sunGroup = isEvenWeek ? groupB : groupA;
          // Os que folgaram no sábado trabalham no domingo
          const sunT1Count = Math.floor(sunGroup.length / 2);
          sunGroup.forEach((e, idx) => {
            const sIdx = (idx < sunT1Count) ? 0 : 2;
            slots[sIdx].push({ employeeName: e.name, color: 'RED' });
          });
        }
      }

      // Adicionar Plantonistas se houver
      plantonistas.forEach(p => {
        const pName = (p.name || '').trim().toUpperCase();
        const pDays = p.onCallDays || ['SAT', 'SUN'];
        const dayStrMap = { 5: 'FRI', 6: 'SAT', 0: 'SUN' };
        if (dayStrMap[dayOfWeek] && pDays.includes(dayStrMap[dayOfWeek])) {
          const shiftIdx = (p.onCallShift === '3' ? 2 : (p.onCallShift === '2' ? 1 : 0));
          slots[shiftIdx].push({ employeeName: pName, color: (dayOfWeek === 0 || dayOfWeek === 6) ? 'RED' : 'NORMAL' });
        }
      });

      // Aplicação Universal de Preferências de Turno (NIGHT_WEEKDAY, SHIFT_1, SHIFT_2, SHIFT_3)
      this.enforceShiftPreferences(slots, dayOfWeek, day, fridayOffMap, empsList);

      daysSchedule[dayKey] = {
        dayNumber: day,
        dayOfWeek: dayOfWeek,
        slots: slots.map(turnWorkers => ({ workers: turnWorkers }))
      };
    }

    return {
      yearMonth: yearMonthKey,
      year: year,
      month: month,
      selectedEmployeeIds: selectedEmployeeIds,
      generatedAt: new Date().toISOString(),
      days: daysSchedule
    };
  }

  enforceShiftPreferences(slots, dayOfWeek, day, fridayOffMap, empsList) {
    if (!empsList || empsList.length === 0) return;

    empsList.forEach(emp => {
      if (!emp || !emp.prefShift || emp.prefShift === 'NONE' || emp.prefShift === 'PLANTONISTA') return;

      const empName = (emp.name || '').trim().toUpperCase();

      let currentSlotIdx = -1;
      let workerObj = null;

      for (let s = 0; s < 3; s++) {
        const foundIdx = slots[s].findIndex(w => (w.employeeName || '').trim().toUpperCase() === empName);
        if (foundIdx !== -1) {
          currentSlotIdx = s;
          workerObj = slots[s][foundIdx];
          break;
        }
      }

      if (currentSlotIdx === -1) return;

      let targetSlotIdx = -1;

      if (emp.prefShift === 'NIGHT_WEEKDAY') {
        if (dayOfWeek >= 1 && dayOfWeek <= 4) {
          targetSlotIdx = 2; // 3º Turno (Noite) de Seg a Qui
        } else if (dayOfWeek === 5) {
          const isGreen = (workerObj.color === 'GREEN' || (fridayOffMap[day] && fridayOffMap[day].has(empName)));
          targetSlotIdx = isGreen ? 1 : 0; // 1º Turno (Manhã Sexta) ou 2º Turno se folga verde
        }
      } else if (emp.prefShift === 'SHIFT_1') {
        targetSlotIdx = 0; // 1º Turno (Manhã)
      } else if (emp.prefShift === 'SHIFT_2') {
        targetSlotIdx = 1; // 2º Turno (Intermediário)
      } else if (emp.prefShift === 'SHIFT_3') {
        targetSlotIdx = 2; // 3º Turno (Noite)
      }

      if (targetSlotIdx !== -1 && targetSlotIdx !== currentSlotIdx) {
        const idxInCurrent = slots[currentSlotIdx].findIndex(w => (w.employeeName || '').trim().toUpperCase() === empName);
        if (idxInCurrent !== -1) {
          slots[currentSlotIdx].splice(idxInCurrent, 1);
        }

        let swapped = false;
        for (let i = 0; i < slots[targetSlotIdx].length; i++) {
          const targetWorker = slots[targetSlotIdx][i];
          const targetEmp = empsList.find(e => (e.name || '').trim().toUpperCase() === (targetWorker.employeeName || '').trim().toUpperCase());
          if (!targetEmp || targetEmp.prefShift === 'NONE') {
            const [movedTarget] = slots[targetSlotIdx].splice(i, 1);
            slots[currentSlotIdx].push(movedTarget);
            slots[targetSlotIdx].push(workerObj);
            swapped = true;
            break;
          }
        }

        if (!swapped) {
          slots[targetSlotIdx].push(workerObj);
        }
      }
    });
  }
}

const scheduler = new PharmacyScheduler(window.store);
window.scheduler = scheduler;
