/**
 * CALENDAR.JS - Grade com 3 Turnos Fixos, Drag & Drop Completo e Editor Manual
 */

const MONTH_NAMES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

function getEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getBrazilianHolidays(year) {
  const holidays = {};
  
  // Feriados Nacionais Fixos (Leis 662/1949, 6.802/1980, 10.607/2002 e 14.759/2023)
  const fixed = [
    { day: 1, month: 1, name: 'Confraternização Universal (Ano Novo)' },
    { day: 21, month: 4, name: 'Tiradentes' },
    { day: 1, month: 5, name: 'Dia Mundial do Trabalho' },
    { day: 7, month: 9, name: 'Independência do Brasil' },
    { day: 12, month: 10, name: 'Nossa Senhora Aparecida' },
    { day: 2, month: 11, name: 'Finados' },
    { day: 15, month: 11, name: 'Proclamação da República' },
    { day: 20, month: 11, name: 'Dia Nacional de Zumbi e da Consciência Negra' },
    { day: 25, month: 12, name: 'Natal' }
  ];
  
  fixed.forEach(f => {
    const key = `${year}-${String(f.month).padStart(2, '0')}-${String(f.day).padStart(2, '0')}`;
    holidays[key] = f.name;
  });

  // Feriados Móveis baseados na Páscoa
  const easter = getEasterDate(year);
  const addOffset = (offsetDays, name) => {
    const d = new Date(easter.getTime() + offsetDays * 24 * 60 * 60 * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    holidays[key] = name;
  };

  addOffset(-47, 'Carnaval');
  addOffset(-2, 'Sexta-feira Santa (Paixão de Cristo)');
  addOffset(0, 'Páscoa');
  addOffset(60, 'Corpus Christi');

  return holidays;
}

class CalendarManager {
  constructor(store, scheduler) {
    this.store = store;
    this.scheduler = scheduler;
    
    // Inicia dinamicamente no mês e ano atual em tempo real (HOJE)
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth() + 1;

    this.draggedWorker = null;
    this.hasJustDragged = false;

    this.init();
  }

  init() {
    this.bindEvents();
    this.startRealtimeClock();
    this.render();
    setTimeout(() => {
      const todayCell = document.querySelector('.calendar-day-cell.is-today');
      if (todayCell) {
        todayCell.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 150);
  }

  startRealtimeClock() {
    const updateClock = () => {
      const clockTextEl = document.getElementById('realtime-clock-text');
      if (!clockTextEl) return;
      const now = new Date();
      const dayNameMap = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
      const dayName = dayNameMap[now.getDay()];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      clockTextEl.textContent = `${dayName}, ${hours}:${minutes}:${seconds}`;
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  bindEvents() {
    document.getElementById('btn-prev-month')?.addEventListener('click', () => this.changeMonth(-1));
    document.getElementById('btn-next-month')?.addEventListener('click', () => this.changeMonth(1));
    document.getElementById('btn-today')?.addEventListener('click', () => this.goToToday());
    this.bindCampaignEvents();

    const monthPicker = document.getElementById('month-picker');
    monthPicker?.addEventListener('change', (e) => {
      if (e.target.value) {
        const [year, month] = e.target.value.split('-').map(Number);
        this.currentYear = year;
        this.currentMonth = month;
        this.render();
      }
    });

    document.getElementById('filter-employee')?.addEventListener('change', (e) => {
      this.highlightEmployee(e.target.value);
    });

    document.getElementById('btn-auto-generate')?.addEventListener('click', () => {
      this.openMonthTeamModal();
    });

    // Botão Equipe do Mês
    document.getElementById('btn-month-team')?.addEventListener('click', () => {
      this.openMonthTeamModal();
    });

    // Botão Salvar Equipe do Mês
    document.getElementById('btn-save-month-team')?.addEventListener('click', () => {
      this.saveMonthTeam();
    });

    const btnTeam = document.getElementById('btn-manage-team');
    if (btnTeam) {
      btnTeam.addEventListener('click', () => {
        window.employeeManager?.render();
        window.app?.openModal('modal-team-manager');
      });
    }

    document.getElementById('btn-clear-month')?.addEventListener('click', () => {
      document.getElementById('more-actions-dropdown')?.classList.add('hidden');
      if (confirm(`Deseja realmente limpar toda a escala de ${MONTH_NAMES[this.currentMonth - 1]} / ${this.currentYear}?`)) {
        const yearMonthKey = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}`;
        this.store.deleteMonthSchedule(yearMonthKey);
        this.render();
        window.app?.showToast('Escala do mês limpa!', 'info');
      }
    });

    // Submissão do formulário de edição de turnos
    document.getElementById('form-edit-slot')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSlotEdit();
    });

    // Botão Limpar Dia
    document.getElementById('btn-clear-day-slots')?.addEventListener('click', () => {
      const dateKey = document.getElementById('edit-slot-date')?.value;
      if (dateKey) this.clearDaySlots(dateKey);
    });

    // Botões para adicionar mais pessoas a um turno específico
    document.querySelectorAll('.btn-add-person-shift').forEach(btn => {
      btn.addEventListener('click', () => {
        const shiftNum = parseInt(btn.dataset.shift, 10);
        this.appendPersonToShift(shiftNum, '', 'NORMAL');
      });
    });

    // Botões de Copiar e Colar na barra flutuante
    document.getElementById('btn-paste-current-week')?.addEventListener('click', () => {
      this.pasteToWeekdaysOfWeek();
    });

    document.getElementById('btn-paste-all-weekdays')?.addEventListener('click', () => {
      this.pasteToAllWeekdaysOfMonth();
    });

    document.getElementById('btn-cancel-copy')?.addEventListener('click', () => {
      this.cancelCopy();
    });

    // Botões de Copiar e Colar no Modal de Edição do Dia
    document.getElementById('btn-modal-copy-day')?.addEventListener('click', () => {
      const dateKey = document.getElementById('edit-slot-date')?.value;
      if (dateKey) this.copyDaySchedule(dateKey);
    });

    document.getElementById('btn-modal-paste-day')?.addEventListener('click', () => {
      if (!this.copiedDayData || !this.copiedDayData.slots) {
        window.app?.showToast('Nenhum horário copiado.', 'warning');
        return;
      }
      for (let shiftNum = 1; shiftNum <= 3; shiftNum++) {
        const container = document.getElementById(`shift-${shiftNum}-workers`);
        if (container) container.innerHTML = '';
        const workers = this.copiedDayData.slots[shiftNum - 1] || [];
        if (workers.length === 0) {
          this.appendPersonToShift(shiftNum, '', 'NORMAL');
        } else {
          workers.forEach(w => {
            this.appendPersonToShift(shiftNum, w.employeeName, w.color || 'NORMAL');
          });
        }
      }
      window.app?.showToast(`Horário do dia ${String(this.copiedDayData.dayNumber).padStart(2, '0')} carregado!`, 'info');
    });
  }

  changeMonth(delta) {
    this.currentMonth += delta;
    if (this.currentMonth > 12) {
      this.currentMonth = 1;
      this.currentYear++;
    } else if (this.currentMonth < 1) {
      this.currentMonth = 12;
      this.currentYear--;
    }
    this.render();
  }

  goToToday() {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth() + 1;
    this.render();
  }

  getYearMonthKey() {
    return `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}`;
  }

  generateAndSaveCurrentMonth() {
    try {
      const schedule = this.scheduler.generateMonthSchedule(this.currentYear, this.currentMonth);
      this.store.saveMonthSchedule(this.getYearMonthKey(), schedule);
      this.render();
      window.app?.showToast(`Escala de ${MONTH_NAMES[this.currentMonth - 1]}/${this.currentYear} gerada!`, 'success');
    } catch (err) {
      window.app?.showToast(err.message || 'Erro ao gerar escala', 'error');
    }
  }

  getEmptyMonthSchedule(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysSchedule = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      daysSchedule[dayKey] = {
        dayNumber: day,
        dayOfWeek: date.getDay(),
        slots: [{ workers: [] }, { workers: [] }, { workers: [] }]
      };
    }
    return {
      yearMonth: `${year}-${String(month).padStart(2, '0')}`,
      year: year,
      month: month,
      days: daysSchedule
    };
  }

  render() {
    const yearMonthKey = this.getYearMonthKey();
    const monthTitle = `${MONTH_NAMES[this.currentMonth - 1]} / ${this.currentYear}`;
    
    const displayEl = document.getElementById('current-month-display');
    if (displayEl) {
      displayEl.textContent = monthTitle;
    }
    
    const pickerEl = document.getElementById('month-picker');
    if (pickerEl) pickerEl.value = yearMonthKey;

    const btnToday = document.getElementById('btn-today');
    if (btnToday) {
      const now = new Date();
      const isCurrentMonthYear = (this.currentYear === now.getFullYear() && this.currentMonth === (now.getMonth() + 1));
      btnToday.classList.toggle('btn-today-pulse', !isCurrentMonthYear);
    }

    let schedule = this.store.getMonthSchedule(yearMonthKey);
    if (!schedule) {
      schedule = this.getEmptyMonthSchedule(this.currentYear, this.currentMonth);
    }

    this.renderCalendarGrid(schedule);
    this.renderFilterOptions();
    this.renderMonthlyStats(schedule);
    this.renderHolidaysFooter();
    this.renderCampaignsFooter();

    const printableCal = document.getElementById('printable-calendar');
    if (printableCal) {
      if (this.store.isAdmin()) {
        printableCal.classList.add('admin-active');
      } else {
        printableCal.classList.remove('admin-active');
      }
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /**
   * Normaliza os slots de um dia para garantir exatamente 3 turnos sem duplicatas internas
   */
  normalizeDaySlots(rawSlots) {
    const normalized = [[], [], []];
    if (!rawSlots || !Array.isArray(rawSlots)) return normalized;

    for (let i = 0; i < 3; i++) {
      const slotData = rawSlots[i];
      if (!slotData) continue;

      const seenInTurn = new Set();

      if (Array.isArray(slotData)) {
        slotData.forEach(item => {
          if (item && item.employeeName && item.employeeName.trim()) {
            const name = item.employeeName.trim();
            if (!seenInTurn.has(name)) {
              seenInTurn.add(name);
              normalized[i].push({ employeeName: name, color: item.color || 'NORMAL' });
            }
          }
        });
      } else if (slotData.workers && Array.isArray(slotData.workers)) {
        slotData.workers.forEach(item => {
          if (item && item.employeeName && item.employeeName.trim()) {
            const name = item.employeeName.trim();
            if (!seenInTurn.has(name)) {
              seenInTurn.add(name);
              normalized[i].push({ employeeName: name, color: item.color || 'NORMAL' });
            }
          }
        });
      } else if (slotData.employeeName && slotData.employeeName.trim()) {
        const parts = slotData.employeeName.split('/').map(p => p.trim()).filter(Boolean);
        parts.forEach(name => {
          if (!seenInTurn.has(name)) {
            seenInTurn.add(name);
            normalized[i].push({ employeeName: name, color: slotData.color || 'NORMAL' });
          }
        });
      }
    }

    return normalized;
  }

  renderCalendarGrid(schedule) {
    const gridEl = document.getElementById('calendar-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    const isAdmin = this.store.isAdmin();

    // Dinâmico: Admin vê Seg-Dom (fins de semana juntos). Público vê Dom-Sáb (padrão tradicional)
    const headerRowEl = document.getElementById('calendar-header-row');
    if (headerRowEl) {
      if (isAdmin) {
        headerRowEl.innerHTML = `
          <div class="col-header weekday-col">SEGUNDA</div>
          <div class="col-header weekday-col">TERÇA</div>
          <div class="col-header weekday-col">QUARTA</div>
          <div class="col-header weekday-col">QUINTA</div>
          <div class="col-header weekday-col">SEXTA</div>
          <div class="col-header weekend-col">SÁBADO</div>
          <div class="col-header weekend-col">DOMINGO</div>
        `;
      } else {
        headerRowEl.innerHTML = `
          <div class="col-header weekend-col">DOMINGO</div>
          <div class="col-header weekday-col">SEGUNDA</div>
          <div class="col-header weekday-col">TERÇA</div>
          <div class="col-header weekday-col">QUARTA</div>
          <div class="col-header weekday-col">QUINTA</div>
          <div class="col-header weekday-col">SEXTA</div>
          <div class="col-header weekend-col">SÁBADO</div>
        `;
      }
    }

    const firstDayDate = new Date(this.currentYear, this.currentMonth - 1, 1);
    const totalDaysInMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

    let firstDayIndex;
    if (isAdmin) {
      firstDayIndex = firstDayDate.getDay() - 1;
      if (firstDayIndex === -1) firstDayIndex = 6;
    } else {
      firstDayIndex = firstDayDate.getDay();
    }

    for (let i = 0; i < firstDayIndex; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-day-cell other-month';
      gridEl.appendChild(emptyCell);
    }

    const today = new Date();
    const isCurrentActualMonth = (today.getFullYear() === this.currentYear && (today.getMonth() + 1) === this.currentMonth);

    const holidaysMap = getBrazilianHolidays(this.currentYear);

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateKey = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const rawDayData = (schedule.days && schedule.days[dateKey]) || { dayNumber: day, slots: [] };
      const normalizedSlots = this.normalizeDaySlots(rawDayData.slots);

      const dateObj = new Date(this.currentYear, this.currentMonth - 1, day);
      const isWeekend = (dateObj.getDay() === 0 || dateObj.getDay() === 6);
      const isHoliday = Boolean(holidaysMap[dateKey]);
      const holidayName = holidaysMap[dateKey] || '';
      const isToday = isCurrentActualMonth && (today.getDate() === day);

      const isCopiedSource = Boolean(this.copiedDayData && this.copiedDayData.dateKey === dateKey);
      const hasCopied = Boolean(this.copiedDayData && this.copiedDayData.slots);

      const dayCell = document.createElement('div');
      dayCell.className = `calendar-day-cell ${isWeekend ? 'is-weekend' : ''} ${isHoliday ? 'is-holiday' : ''} ${isToday ? 'is-today' : ''} ${isCopiedSource ? 'is-copied-source' : ''} ${hasCopied ? 'has-copied-active' : ''}`;
      dayCell.dataset.dateKey = dateKey;
      if (isHoliday) {
        dayCell.title = `Feriado Nacional: ${holidayName}`;
      }

      // Topbar com Badge do Dia, Tag HOJE, Tag de Feriado, Ações e Ações Rápidas (Copiar / Colar)
      const topbarEl = document.createElement('div');
      topbarEl.className = 'day-cell-topbar';

      const dayHeaderGroup = document.createElement('div');
      dayHeaderGroup.className = 'day-header-group';

      const topRow = document.createElement('div');
      topRow.className = 'day-header-top-row';

      const dayHeader = document.createElement('span');
      dayHeader.className = 'day-header-badge';
      dayHeader.textContent = day;
      topRow.appendChild(dayHeader);

      if (isToday) {
        const todayBadge = document.createElement('span');
        todayBadge.className = 'today-badge-tag';
        todayBadge.textContent = 'HOJE';
        todayBadge.title = 'Hoje';
        topRow.appendChild(todayBadge);
      }

      if (isHoliday) {
        const holBadge = document.createElement('span');
        holBadge.className = 'holiday-badge-tag';
        holBadge.textContent = 'Feriado';
        holBadge.title = holidayName;
        topRow.appendChild(holBadge);
      }

      dayHeaderGroup.appendChild(topRow);

      const actionsStack = document.createElement('div');
      actionsStack.className = 'day-actions-stack';

      const allCampaigns = this.store.getCampaigns();
      const activeCampaigns = this.getCampaignStatusForDate(dateKey, allCampaigns);
      const activeList = activeCampaigns.filter(c => c.isActive);
      const radarColors = [];

      const isSingleAction = (activeList.length === 1);

      activeList.forEach(({ campaign, isRadarAlert }) => {
        const campColor = campaign.color || '#eab308';
        const hexToRgba = (hex, alpha) => {
          let c = (hex || '#eab308').replace('#', '');
          if (c.length === 3) c = c.split('').map(x => x + x).join('');
          const num = parseInt(c, 16);
          return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
        };

        const campBadge = document.createElement('span');
        campBadge.className = `action-badge-tag ${isRadarAlert ? 'pulse-radar-alert' : ''}`;
        campBadge.style.backgroundColor = campColor;
        if (isRadarAlert) {
          campBadge.style.setProperty('--badge-glow-start', hexToRgba(campColor, 0.7));
          campBadge.style.setProperty('--badge-glow-peak', hexToRgba(campColor, 0.85));
          campBadge.style.setProperty('--badge-glow-end', hexToRgba(campColor, 0));
        }
        campBadge.title = `Ação: ${campaign.title}`;
        campBadge.innerHTML = `<i data-lucide="target" style="width: 10px; height: 10px;"></i> <span>${campaign.title}</span>`;

        if (isSingleAction) {
          topRow.appendChild(campBadge);
        } else {
          actionsStack.appendChild(campBadge);
        }

        if (isRadarAlert) {
          radarColors.push(campaign.color || '#eab308');
        }
      });

      if (!isSingleAction && actionsStack.children.length > 0) {
        dayHeaderGroup.appendChild(actionsStack);
      }

      const uniqueRadarColors = [...new Set(radarColors)];
      if (uniqueRadarColors.length === 1) {
        const campColor = uniqueRadarColors[0];
        const hexToRgba = (hex, alpha) => {
          let c = (hex || '#eab308').replace('#', '');
          if (c.length === 3) c = c.split('').map(x => x + x).join('');
          const num = parseInt(c, 16);
          return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
        };
        dayCell.classList.add('pulse-upcoming-day-box');
        dayCell.style.setProperty('--campaign-color', campColor);
        dayCell.style.setProperty('--campaign-glow-start', hexToRgba(campColor, 0.35));
        dayCell.style.setProperty('--campaign-glow-peak', hexToRgba(campColor, 0.85));
      } else if (uniqueRadarColors.length >= 2) {
        const hexToRgba = (hex, alpha) => {
          let c = (hex || '#eab308').replace('#', '');
          if (c.length === 3) c = c.split('').map(x => x + x).join('');
          const num = parseInt(c, 16);
          return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
        };
        const shadowPeak = uniqueRadarColors.map((col, idx) => `0 0 ${16 + idx * 8}px ${4 + idx * 2}px ${hexToRgba(col, 0.85)}`).join(', ');
        const shadowStart = uniqueRadarColors.map((col, idx) => `0 0 0 0 ${hexToRgba(col, 0.35)}`).join(', ');

        dayCell.classList.add('pulse-gradient-day-box');
        dayCell.style.setProperty('--campaign-gradient-border', `linear-gradient(135deg, ${uniqueRadarColors.join(', ')})`);
        dayCell.style.setProperty('--campaign-glow-start', shadowStart);
        dayCell.style.setProperty('--campaign-glow-peak', shadowPeak);
      }

      topbarEl.appendChild(dayHeaderGroup);

      if (this.store.isAdmin()) {
        const actionsEl = document.createElement('div');
        actionsEl.className = 'day-cell-actions';

        const btnCopy = document.createElement('button');
        btnCopy.type = 'button';
        btnCopy.className = 'btn-day-action btn-copy-day';
        btnCopy.title = `Copiar horários do dia ${day}`;
        btnCopy.innerHTML = '<i data-lucide="copy"></i>';
        btnCopy.addEventListener('click', (e) => this.copyDaySchedule(dateKey, e));
        actionsEl.appendChild(btnCopy);

        const btnPaste = document.createElement('button');
        btnPaste.type = 'button';
        btnPaste.className = `btn-day-action btn-paste-day ${hasCopied ? '' : 'disabled'}`;
        btnPaste.title = hasCopied ? `Colar horário do dia ${this.copiedDayData.dayNumber} aqui` : 'Nenhum horário copiado ainda';
        btnPaste.innerHTML = '<i data-lucide="clipboard-paste"></i>';
        btnPaste.addEventListener('click', (e) => this.pasteDaySchedule(dateKey, e));
        actionsEl.appendChild(btnPaste);

        topbarEl.appendChild(actionsEl);
      }

      dayCell.appendChild(topbarEl);

      const slotsContainer = document.createElement('div');
      slotsContainer.className = 'day-slots-container';

      // Renderiza exatamente os 3 turnos
      for (let turnIndex = 0; turnIndex < 3; turnIndex++) {
        const workersInTurn = normalizedSlots[turnIndex];
        const slotEl = document.createElement('div');
        slotEl.dataset.turnIndex = turnIndex;
        slotEl.dataset.dateKey = dateKey;

        if (workersInTurn.length === 0) {
          slotEl.className = 'slot-item empty-slot';
          slotEl.innerHTML = '<span class="empty-dash">——————</span>';
        } else {
          slotEl.className = 'slot-item slot-turn-multi';

          const chipsElements = workersInTurn.map((w, wIdx) => {
            const colorClass = `color-${(w.color || 'NORMAL').toLowerCase()}`;
            return `<span class="worker-chip ${colorClass}" draggable="${this.store.isAdmin()}" data-emp="${w.employeeName}" data-color="${w.color || 'NORMAL'}" data-widx="${wIdx}" data-turn="${turnIndex}" data-date="${dateKey}">${w.employeeName}</span>`;
          }).join('<span class="slot-slash">/</span>');

          slotEl.innerHTML = chipsElements;
        }

        // Habilita Drag & Drop nos slots se for Admin
        if (this.store.isAdmin()) {
          this.attachSlotDragAndDrop(slotEl, dateKey, turnIndex);
        }

        slotsContainer.appendChild(slotEl);
      }

      dayCell.appendChild(slotsContainer);

      // Clique no dia para abrir edição manual
      dayCell.addEventListener('click', (e) => {
        if (this.store.isAdmin()) {
          if (this.hasJustDragged) {
            this.hasJustDragged = false;
            return;
          }
          this.openEditSlotModal(dateKey, rawDayData);
        }
      });

      gridEl.appendChild(dayCell);
    }

    const totalRenderedCells = firstDayIndex + totalDaysInMonth;
    const targetTotalCells = totalRenderedCells > 35 ? 42 : 35;
    const remainingCells = targetTotalCells - totalRenderedCells;
    for (let i = 0; i < remainingCells; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-day-cell other-month';
      gridEl.appendChild(emptyCell);
    }
  }

  /**
   * Configuração de Arrastar e Soltar (Drag & Drop) entre turnos e dias
   */
  attachSlotDragAndDrop(slotEl, dateKey, turnIndex) {
    // 1. Arrastar os nomes (Worker Chips)
    const chips = slotEl.querySelectorAll('.worker-chip');
    chips.forEach(chip => {
      chip.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        this.draggedWorker = {
          dateKey: chip.dataset.date,
          turnIndex: parseInt(chip.dataset.turn, 10),
          workerIndex: parseInt(chip.dataset.widx, 10),
          employeeName: chip.dataset.emp,
          color: chip.dataset.color
        };
        chip.classList.add('chip-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', chip.dataset.emp);
      });

      chip.addEventListener('dragend', (e) => {
        e.stopPropagation();
        chip.classList.remove('chip-dragging');
        document.querySelectorAll('.slot-item').forEach(s => s.classList.remove('slot-drag-hover', 'slot-drag-group'));
        setTimeout(() => { this.draggedWorker = null; }, 50);
      });
    });

    // 2. Soltar no Turno (Slot)
    slotEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      
      if (e.shiftKey) {
        slotEl.classList.add('slot-drag-group');
        slotEl.classList.remove('slot-drag-hover');
      } else {
        slotEl.classList.add('slot-drag-hover');
        slotEl.classList.remove('slot-drag-group');
      }
    });

    slotEl.addEventListener('dragleave', (e) => {
      e.stopPropagation();
      slotEl.classList.remove('slot-drag-hover', 'slot-drag-group');
    });

    slotEl.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      slotEl.classList.remove('slot-drag-hover', 'slot-drag-group');

      if (!this.draggedWorker) return;

      this.hasJustDragged = true;
      const targetDateKey = slotEl.dataset.dateKey;
      const targetTurnIndex = parseInt(slotEl.dataset.turnIndex, 10);
      const isGrouping = !!e.shiftKey;

      this.moveOrSwapWorker(this.draggedWorker, targetDateKey, targetTurnIndex, isGrouping);
    });
  }

  /**
   * Executa a inversão/troca (SWAP padrão) ou Agrupamento (com SHIFT) de turno/dia ao arrastar
   */
  moveOrSwapWorker(source, targetDateKey, targetTurnIndex, isGrouping = false) {
    const yearMonthKey = this.getYearMonthKey();
    let schedule = this.store.getMonthSchedule(yearMonthKey);
    if (!schedule || !schedule.days) return;

    const sourceDay = schedule.days[source.dateKey];
    const targetDay = schedule.days[targetDateKey];
    if (!sourceDay || !targetDay) return;

    // Se soltou no mesmo turno do mesmo dia, não faz nada
    if (source.dateKey === targetDateKey && source.turnIndex === targetTurnIndex) {
      return;
    }

    if (source.dateKey === targetDateKey) {
      // 1. MESMO DIA: opera sobre a mesma matriz de turnos
      const dayNormalized = this.normalizeDaySlots(sourceDay.slots);
      const sourceWorkers = dayNormalized[source.turnIndex];
      const targetWorkers = dayNormalized[targetTurnIndex];

      const movedWorker = sourceWorkers.splice(source.workerIndex, 1)[0] || {
        employeeName: source.employeeName,
        color: source.color || 'NORMAL'
      };

      if (isGrouping) {
        // AGRUPAR / JUNTAR (Com Shift)
        const alreadyInTarget = targetWorkers.some(w => w.employeeName === movedWorker.employeeName);
        if (!alreadyInTarget) {
          targetWorkers.push(movedWorker);
        }
        window.app?.showToast(`➕ ${movedWorker.employeeName} agrupado(a) no ${targetTurnIndex + 1}º Turno!`, 'success');
      } else {
        // TROCA (Padrão) OU MOVER SE VAZIO
        if (targetWorkers.length > 0) {
          const targetWorker = targetWorkers.shift();
          targetWorkers.push(movedWorker);
          sourceWorkers.push(targetWorker);
          window.app?.showToast(`⇄ Invertido: ${movedWorker.employeeName} ⇄ ${targetWorker.employeeName}!`, 'success');
        } else {
          targetWorkers.push(movedWorker);
          window.app?.showToast(`${movedWorker.employeeName} movido(a) para o ${targetTurnIndex + 1}º Turno!`, 'success');
        }
      }

      sourceDay.slots = dayNormalized.map(wList => ({ workers: wList }));
    } else {
      // 2. DIAS DIFERENTES
      const sourceNormalized = this.normalizeDaySlots(sourceDay.slots);
      const targetNormalized = this.normalizeDaySlots(targetDay.slots);

      const sourceWorkers = sourceNormalized[source.turnIndex];
      const targetWorkers = targetNormalized[targetTurnIndex];

      const movedWorker = sourceWorkers.splice(source.workerIndex, 1)[0] || {
        employeeName: source.employeeName,
        color: source.color || 'NORMAL'
      };

      if (isGrouping) {
        // AGRUPAR / JUNTAR (Com Shift)
        const alreadyInTarget = targetWorkers.some(w => w.employeeName === movedWorker.employeeName);
        if (!alreadyInTarget) {
          targetWorkers.push(movedWorker);
        }
        window.app?.showToast(`➕ ${movedWorker.employeeName} agrupado(a) no ${targetTurnIndex + 1}º Turno!`, 'success');
      } else {
        // TROCA (Padrão) OU MOVER SE VAZIO
        if (targetWorkers.length > 0) {
          const targetWorker = targetWorkers.shift();
          targetWorkers.push(movedWorker);
          sourceWorkers.push(targetWorker);
          window.app?.showToast(`⇄ Invertido: ${movedWorker.employeeName} ⇄ ${targetWorker.employeeName}!`, 'success');
        } else {
          targetWorkers.push(movedWorker);
          window.app?.showToast(`${movedWorker.employeeName} movido(a) para o ${targetTurnIndex + 1}º Turno!`, 'success');
        }
      }

      sourceDay.slots = sourceNormalized.map(wList => ({ workers: wList }));
      targetDay.slots = targetNormalized.map(wList => ({ workers: wList }));
    }

    this.store.saveMonthSchedule(yearMonthKey, schedule);
    this.render();
  }

  openEditSlotModal(dateKey, rawDayData) {
    const [y, m, d] = dateKey.split('-');
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeekNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    const titleEl = document.getElementById('edit-slot-date-title');
    if (titleEl) titleEl.textContent = `Dia ${d} (${dayOfWeekNames[dateObj.getDay()]})`;

    const descEl = document.getElementById('edit-slot-desc');
    if (descEl) descEl.textContent = `${d} de ${MONTH_NAMES[parseInt(m, 10) - 1]} de ${y}`;

    const dateInput = document.getElementById('edit-slot-date');
    if (dateInput) dateInput.value = dateKey;

    const normalizedSlots = this.normalizeDaySlots(rawDayData.slots);

    // Popula cada um dos 3 turnos
    for (let shiftNum = 1; shiftNum <= 3; shiftNum++) {
      const container = document.getElementById(`shift-${shiftNum}-workers`);
      if (container) {
        container.innerHTML = '';
        const workers = normalizedSlots[shiftNum - 1];

        if (workers.length === 0) {
          this.appendPersonToShift(shiftNum, '', 'NORMAL');
        } else {
          workers.forEach(w => {
            this.appendPersonToShift(shiftNum, w.employeeName, w.color || 'NORMAL');
          });
        }
      }
    }

    window.app?.openModal('modal-edit-slot');
  }

  appendPersonToShift(shiftNum, selectedEmp = '', selectedColor = 'NORMAL') {
    const container = document.getElementById(`shift-${shiftNum}-workers`);
    if (!container) return;

    const rowEl = document.createElement('div');
    rowEl.className = 'shift-worker-row';

    const employees = this.store.getActiveEmployees();
    let optionsHtml = '<option value="">(Vazio / Folga)</option>';
    employees.forEach(emp => {
      optionsHtml += `<option value="${emp.name}" ${emp.name === selectedEmp ? 'selected' : ''}>${emp.name}</option>`;
    });

    const isExtra = container.children.length > 0;

    rowEl.innerHTML = `
      <select class="select-input-modern worker-name-select" style="flex: 1 1 auto; min-width: 200px;">
        ${optionsHtml}
      </select>
      <select class="select-input-modern color-select worker-color-select" style="flex: 0 0 135px; width: 135px;">
        <option value="NORMAL" ${selectedColor === 'NORMAL' ? 'selected' : ''}>Normal</option>
        <option value="GREEN" ${selectedColor === 'GREEN' ? 'selected' : ''}>Verde (Folga)</option>
        <option value="RED" ${selectedColor === 'RED' ? 'selected' : ''}>Vermelho (Fim Sem.)</option>
      </select>
      ${isExtra ? `
        <button type="button" class="btn-icon-danger btn-remove-worker" title="Remover" style="width: 32px; height: 32px; flex-shrink: 0;">
          <i data-lucide="x" style="width: 13px; height: 13px;"></i>
        </button>
      ` : ''}
    `;

    const removeBtn = rowEl.querySelector('.btn-remove-worker');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => rowEl.remove());
    }

    container.appendChild(rowEl);

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  saveSlotEdit() {
    const dateKey = document.getElementById('edit-slot-date')?.value;
    if (!dateKey) return;

    const yearMonthKey = this.getYearMonthKey();
    let schedule = this.store.getMonthSchedule(yearMonthKey);
    if (!schedule) {
      schedule = this.scheduler.generateMonthSchedule(this.currentYear, this.currentMonth);
    }
    if (!schedule.days) schedule.days = {};

    const newSlots = [];

    for (let shiftNum = 1; shiftNum <= 3; shiftNum++) {
      const container = document.getElementById(`shift-${shiftNum}-workers`);
      const rows = container ? container.querySelectorAll('.shift-worker-row') : [];
      const workers = [];
      const seenInThisShift = new Set();

      rows.forEach(row => {
        const selectName = row.querySelector('.worker-name-select');
        const selectColor = row.querySelector('.worker-color-select');
        const name = selectName ? selectName.value.trim() : '';
        const color = selectColor ? selectColor.value : 'NORMAL';
        
        // Bloqueia duplicatas no MESMO turno
        if (name && !seenInThisShift.has(name)) {
          seenInThisShift.add(name);
          workers.push({ employeeName: name, color: color });
        }
      });

      newSlots.push({ workers: workers });
    }

    const dayNumber = parseInt(dateKey.split('-')[2], 10);
    const dateObj = new Date(this.currentYear, this.currentMonth - 1, dayNumber);

    schedule.days[dateKey] = {
      dayNumber: dayNumber,
      dayOfWeek: dateObj.getDay(),
      slots: newSlots
    };

    this.store.saveMonthSchedule(yearMonthKey, schedule);
    window.app?.closeModal('modal-edit-slot');
    this.render();
    window.app?.showToast('Turnos salvos com sucesso!', 'success');
  }

  clearDaySlots(dateKey) {
    const yearMonthKey = this.getYearMonthKey();
    const schedule = this.store.getMonthSchedule(yearMonthKey);
    if (!schedule || !schedule.days || !schedule.days[dateKey]) return;

    schedule.days[dateKey].slots = [
      { workers: [] },
      { workers: [] },
      { workers: [] }
    ];

    this.store.saveMonthSchedule(yearMonthKey, schedule);
    window.app?.closeModal('modal-edit-slot');
    this.render();
    window.app?.showToast('Dia limpo com sucesso!', 'info');
  }

  renderFilterOptions() {
    const filterSelect = document.getElementById('filter-employee');
    if (!filterSelect) return;
    const currentValue = filterSelect.value;
    const employees = this.store.getEmployees();

    filterSelect.innerHTML = '<option value="ALL">Visualizar Todos</option>';
    employees.forEach(emp => {
      const opt = document.createElement('option');
      opt.value = emp.name;
      opt.textContent = `Destacar: ${emp.name}`;
      if (emp.name === currentValue) opt.selected = true;
      filterSelect.appendChild(opt);
    });
  }

  highlightEmployee(employeeName) {
    const workerChips = document.querySelectorAll('.calendar-day-cell .worker-chip');
    if (employeeName === 'ALL' || !employeeName) {
      workerChips.forEach(chip => {
        chip.classList.remove('highlighted', 'dimmed');
      });
      return;
    }

    workerChips.forEach(chip => {
      if (chip.dataset.emp === employeeName) {
        chip.classList.add('highlighted');
        chip.classList.remove('dimmed');
      } else {
        chip.classList.remove('highlighted');
        chip.classList.add('dimmed');
      }
    });
  }

  renderMonthlyStats(schedule) {
    const statsContainer = document.getElementById('monthly-stats-grid');
    if (!statsContainer) return;
    statsContainer.innerHTML = '';

    const employees = this.store.getActiveEmployees();
    const counts = {};

    employees.forEach(emp => {
      counts[emp.name] = { totalShifts: 0, emp };
    });

    if (schedule && schedule.days) {
      Object.values(schedule.days).forEach(day => {
        if (day && day.slots) {
          const normalized = this.normalizeDaySlots(day.slots);
          const dayEmpsWorked = new Set();
          normalized.forEach(turnWorkers => {
            turnWorkers.forEach(w => {
              // Folga (cor GREEN) NÃO conta como dia de trabalho
              if (w.employeeName && counts[w.employeeName] && w.color !== 'GREEN') {
                if (!dayEmpsWorked.has(w.employeeName)) {
                  dayEmpsWorked.add(w.employeeName);
                  counts[w.employeeName].totalShifts++;
                }
              }
            });
          });
        }
      });
    }

  renderMonthlyStats(schedule) {
    const statsContainer = document.getElementById('monthly-stats-grid');
    if (!statsContainer) return;
    statsContainer.innerHTML = '';

    const yearMonthKey = this.getYearMonthKey();
    const monthEmployees = this.store.getMonthEmployees(yearMonthKey);
    const counts = {};
    monthEmployees.forEach(emp => { counts[emp.name] = { totalShifts: 0, emp }; });

    if (schedule && schedule.days) {
      Object.values(schedule.days).forEach(day => {
        if (day && day.slots) {
          const normalized = this.normalizeDaySlots(day.slots);
          const dayEmpsWorked = new Set();
          normalized.forEach(turnWorkers => {
            turnWorkers.forEach(w => {
              // Folga (cor GREEN) NÃO conta como dia de trabalho
              if (w.employeeName && counts[w.employeeName] && w.color !== 'GREEN') {
                if (!dayEmpsWorked.has(w.employeeName)) {
                  dayEmpsWorked.add(w.employeeName);
                  counts[w.employeeName].totalShifts++;
                }
              }
            });
          });
        }
      });
    }

    monthEmployees.forEach(emp => {
      const stat = counts[emp.name] || { totalShifts: 0, emp };
      const chip = document.createElement('div');
      chip.className = 'stat-chip-pill';
      chip.innerHTML = `
        <span class="stat-chip-dot" style="background-color: ${emp.color || '#10b981'};"></span>
        <span>${emp.name}:</span>
        <span class="stat-chip-badge">${stat.totalShifts} dias</span>
      `;
      statsContainer.appendChild(chip);
    });
  }

  renderHolidaysFooter() {
    const container = document.getElementById('calendar-holidays-container');
    if (!container) return;
    container.innerHTML = '';

    const holidaysMap = getBrazilianHolidays(this.currentYear);
    const monthHolidays = [];
    const daysInMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (holidaysMap[dateKey]) {
        monthHolidays.push({ day, dateKey, name: holidaysMap[dateKey] });
      }
    }

    const label = document.createElement('div');
    label.className = 'holiday-label';
    label.innerHTML = '<i data-lucide="flag"></i><span>Feriados Nacionais:</span>';
    container.appendChild(label);

    if (monthHolidays.length === 0) {
      const noneEl = document.createElement('span');
      noneEl.className = 'no-holidays-text';
      noneEl.textContent = 'Nenhum feriado nacional neste mês.';
      container.appendChild(noneEl);
    } else {
      monthHolidays.forEach(h => {
        const item = document.createElement('div');
        item.className = 'holiday-pill-item';
        item.innerHTML = `<strong>${String(h.day).padStart(2, '0')}/${String(this.currentMonth).padStart(2, '0')}</strong> - ${h.name}`;
        container.appendChild(item);
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // --- GERENCIAMENTO E LÓGICA DE AÇÕES E CAMPANHAS ---
  getCampaignStatusForDate(dateKey, campaigns) {
    if (!campaigns || !Array.isArray(campaigns)) return [];
    const targetDate = new Date(dateKey + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const matches = [];

    campaigns.forEach(camp => {
      if (!camp.startDate) return;
      const startDate = new Date(camp.startDate + 'T00:00:00');
      const endDate = camp.endDate ? new Date(camp.endDate + 'T00:00:00') : new Date(2099, 11, 31);

      if (targetDate < startDate || targetDate > endDate) return;

      let isActive = false;

      const tYear = targetDate.getFullYear();
      const tMonth = targetDate.getMonth();
      const tDate = targetDate.getDate();
      const tDay = targetDate.getDay();

      const sMonth = startDate.getMonth();
      const sDate = startDate.getDate();
      const sDay = startDate.getDay();

      if (camp.recurrenceType === 'CUSTOM_RANGE') {
        isActive = true;
      } else if (camp.recurrenceType === 'WEEKDAYS_SPECIFIC') {
        const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const dayStr = dayMap[tDay];
        if (camp.specificDays && Array.isArray(camp.specificDays) && camp.specificDays.length > 0) {
          isActive = camp.specificDays.includes(dayStr);
        } else {
          isActive = (tDay >= 1 && tDay <= 5);
        }
      } else if (camp.recurrenceType === 'MONTHLY' || camp.recurrenceType === 'MONTHLY_DAY' || camp.recurrenceType === 'MONTHLY_WEEKDAY') {
        if (camp.monthlyMode === 'WEEKDAY_ORDINAL' && camp.monthlyOrdinal) {
          const parts = camp.monthlyOrdinal.split('_');
          const dayMap = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
          const reqDay = dayMap[parts[1]];

          if (tDay === reqDay) {
            if (parts[0] === 'LAST') {
              const nextWeekSameDay = new Date(targetDate.getTime() + 7 * 24 * 60 * 60 * 1000);
              isActive = (nextWeekSameDay.getMonth() !== targetDate.getMonth());
            } else {
              const weekNum = Math.ceil(tDate / 7);
              isActive = (weekNum === parseInt(parts[0], 10));
            }
          }
        } else {
          const targetDayNum = camp.monthlyDay || startDate.getDate();
          isActive = (tDate === targetDayNum);
        }
      }

      if (isActive) {
        const diffMs = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const isRadarAlert = (diffDays >= 0 && diffDays <= 3);

        matches.push({ campaign: camp, isActive: true, isRadarAlert });
      }
    });

    return matches;
  }

  renderCampaignsFooter() {
    const container = document.getElementById('calendar-campaigns-container');
    if (!container) return;
    container.innerHTML = '';

    const campaigns = this.store.getCampaigns();
    if (!campaigns || campaigns.length === 0) return;

    const label = document.createElement('div');
    label.className = 'holiday-label';
    label.style.color = '#eab308';
    label.innerHTML = '<i data-lucide="target"></i><span>Ações da Farmácia:</span>';
    container.appendChild(label);

    const monthPrefix = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}`;
    const daysInMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
    const activeInMonthMap = new Map();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${monthPrefix}-${String(day).padStart(2, '0')}`;
      const matches = this.getCampaignStatusForDate(dateKey, campaigns);
      matches.forEach(m => activeInMonthMap.set(m.campaign.id, m));
    }

    if (activeInMonthMap.size === 0) {
      const noneEl = document.createElement('span');
      noneEl.className = 'no-holidays-text';
      noneEl.textContent = 'Nenhuma ação agendada neste mês.';
      container.appendChild(noneEl);
    } else {
      activeInMonthMap.forEach(({ campaign, isRadarAlert }) => {
        const item = document.createElement('div');
        item.className = `campaign-footer-chip ${isRadarAlert ? 'pulse-radar-alert' : ''}`;
        item.style.backgroundColor = campaign.color || '#eab308';
        item.innerHTML = `<i data-lucide="target" style="width: 12px; height: 12px;"></i> <strong>${campaign.title}</strong>`;
        container.appendChild(item);
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

    const btnPublicCampaigns = document.getElementById('btn-public-campaigns');
    if (btnPublicCampaigns) {
      btnPublicCampaigns.addEventListener('click', () => {
        this.openPublicCampaignsModal();
      });
    }

    const btnOpenAdminCamp = document.getElementById('btn-open-admin-campaigns');
    if (btnOpenAdminCamp) {
      btnOpenAdminCamp.addEventListener('click', () => {
        window.app?.closeModal('modal-public-campaigns');
        this.openCampaignsModal();
      });
    }

    const selectRecurrence = document.getElementById('campaign-recurrence');
    const updateRecurrenceFields = () => {
      const val = selectRecurrence?.value;
      const groupWeekdays = document.getElementById('group-specific-weekdays');
      const groupMonthly = document.getElementById('group-monthly-options');

      if (groupWeekdays) groupWeekdays.classList.toggle('hidden', val !== 'WEEKDAYS_SPECIFIC');
      if (groupMonthly) groupMonthly.classList.toggle('hidden', val !== 'MONTHLY');
    };

    selectRecurrence?.addEventListener('change', updateRecurrenceFields);

    const monthlyRadios = document.querySelectorAll('input[name="monthly-mode"]');
    monthlyRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const fixedBox = document.getElementById('monthly-fixed-day-box');
        const ordinalBox = document.getElementById('monthly-weekday-ordinal-box');
        if (fixedBox && ordinalBox) {
          fixedBox.classList.toggle('hidden', e.target.value !== 'FIXED_DAY');
          ordinalBox.classList.toggle('hidden', e.target.value !== 'WEEKDAY_ORDINAL');
        }
      });
    });

    const chipsContainer = document.getElementById('weekdays-chips-container');
    if (chipsContainer) {
      chipsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.weekday-select-chip');
        if (!btn) return;
        btn.classList.toggle('selected');
      });
    }

    const formCampaign = document.getElementById('form-campaign');
    if (formCampaign) {
      formCampaign.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('campaign-id')?.value;
        const title = document.getElementById('campaign-name')?.value.trim();
        const recurrenceType = document.getElementById('campaign-recurrence')?.value;
        const startDate = document.getElementById('campaign-start-date')?.value;
        const endDate = document.getElementById('campaign-end-date')?.value;
        const color = document.getElementById('campaign-color-val')?.value || '#eab308';

        if (!title || !startDate) {
          window.app?.showToast('Preencha o nome e a data de início da ação.', 'warning');
          return;
        }

        let specificDays = [];
        if (recurrenceType === 'WEEKDAYS_SPECIFIC') {
          const selectedChips = document.querySelectorAll('#weekdays-chips-container .weekday-select-chip.selected');
          specificDays = Array.from(selectedChips).map(btn => btn.dataset.day);
          if (specificDays.length === 0) {
            window.app?.showToast('Selecione pelo menos 1 dia da semana.', 'warning');
            return;
          }
        }

        let monthlyMode = 'FIXED_DAY';
        let monthlyDay = 15;
        let monthlyOrdinal = '1_TUE';
        if (recurrenceType === 'MONTHLY') {
          const checkedRadio = document.querySelector('input[name="monthly-mode"]:checked');
          monthlyMode = checkedRadio ? checkedRadio.value : 'FIXED_DAY';
          monthlyDay = parseInt(document.getElementById('campaign-monthly-day')?.value, 10) || 15;
          monthlyOrdinal = document.getElementById('campaign-monthly-ordinal')?.value || '1_TUE';
        }

        const campaign = {
          id: id || undefined,
          title,
          recurrenceType,
          startDate,
          endDate: endDate || startDate,
          color,
          specificDays,
          monthlyMode,
          monthlyDay,
          monthlyOrdinal
        };

        this.store.saveCampaign(campaign);
        this.resetCampaignForm();
        this.renderCampaignsList();
        this.render();
        window.app?.closeModal('modal-campaigns');
        window.app?.showToast(`🎯 Ação "${title}" salva com sucesso!`, 'success');
      });
    }

    const colorContainer = document.getElementById('color-presets-container');
    if (colorContainer) {
      colorContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.color-preset-btn');
        if (!btn) return;
        colorContainer.querySelectorAll('.color-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const colorVal = btn.dataset.color;
        const inputVal = document.getElementById('campaign-color-val');
        if (inputVal) inputVal.value = colorVal;
      });
    }

    const btnCancel = document.getElementById('btn-cancel-campaign-edit');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => this.resetCampaignForm());
    }
  }

  resetCampaignForm() {
    const form = document.getElementById('form-campaign');
    if (form) form.reset();
    document.getElementById('campaign-id').value = '';
    const titleEl = document.getElementById('form-campaign-title');
    if (titleEl) titleEl.textContent = '🎯 Nova Ação / Campanha';
    document.getElementById('btn-cancel-campaign-edit')?.classList.add('hidden');
    const colorContainer = document.getElementById('color-presets-container');
    if (colorContainer) {
      colorContainer.querySelectorAll('.color-preset-btn').forEach(b => b.classList.remove('active'));
      colorContainer.querySelector('[data-color="#eab308"]')?.classList.add('active');
    }
    const colorVal = document.getElementById('campaign-color-val');
    if (colorVal) colorVal.value = '#eab308';

    document.getElementById('group-specific-weekdays')?.classList.add('hidden');
    document.getElementById('group-monthly-options')?.classList.add('hidden');
  }

  formatCampaignDetailText(c) {
    if (!c) return '';

    const formatDate = (isoStr) => {
      if (!isoStr) return '';
      const [y, m, d] = isoStr.split('-');
      return `${d}/${m}/${y}`;
    };

    const startStr = formatDate(c.startDate);
    const endStr = formatDate(c.endDate || c.startDate);
    const periodText = (startStr && endStr && startStr !== endStr)
      ? `de ${startStr} até ${endStr}`
      : `no dia ${startStr}`;

    if (c.recurrenceType === 'WEEKDAYS_SPECIFIC' && c.specificDays && Array.isArray(c.specificDays) && c.specificDays.length > 0) {
      const dayNameMap = {
        MON: 'segunda-feira',
        TUE: 'terça-feira',
        WED: 'quarta-feira',
        THU: 'quinta-feira',
        FRI: 'sexta-feira',
        SAT: 'sábado',
        SUN: 'domingo'
      };

      const daysFormatted = c.specificDays.map(d => dayNameMap[d] || d);
      let daysPhrase = '';

      if (daysFormatted.length === 1) {
        const single = daysFormatted[0];
        daysPhrase = (single === 'sábado' || single === 'domingo')
          ? `todo ${single}`
          : `todas as ${single}s`;
      } else {
        const last = daysFormatted.pop();
        daysPhrase = `todas as ${daysFormatted.join(', ')} e ${last}s`;
      }

      return `Esta ação está cadastrada ${daysPhrase} ${periodText}.`;
    }

    if (c.recurrenceType === 'CUSTOM_RANGE') {
      return `Esta ação está cadastrada em período contínuo ${periodText}.`;
    }

    if (c.recurrenceType === 'MONTHLY' || c.recurrenceType === 'MONTHLY_DAY' || c.recurrenceType === 'MONTHLY_WEEKDAY') {
      if (c.monthlyMode === 'WEEKDAY_ORDINAL' && c.monthlyOrdinal) {
        const ordinalLabels = {
          '1_TUE': '1ª Terça-feira',
          '1_WED': '1ª Quarta-feira',
          '1_THU': '1ª Quinta-feira',
          '1_FRI': '1ª Sexta-feira',
          '2_TUE': '2ª Terça-feira',
          '2_WED': '2ª Quarta-feira',
          '2_THU': '2ª Quinta-feira',
          '2_FRI': '2ª Sexta-feira',
          '3_TUE': '3ª Terça-feira',
          '3_WED': '3ª Quarta-feira',
          '3_THU': '3ª Quinta-feira',
          '3_FRI': '3ª Sexta-feira',
          '4_TUE': '4ª Terça-feira',
          '4_WED': '4ª Quarta-feira',
          '4_THU': '4ª Quinta-feira',
          '4_FRI': '4ª Sexta-feira',
          'LAST_FRI': 'Última Sexta-feira'
        };
        const label = ordinalLabels[c.monthlyOrdinal] || c.monthlyOrdinal;
        return `Esta ação está cadastrada toda ${label} do mês ${periodText}.`;
      } else {
        const dayNum = c.monthlyDay || (c.startDate ? c.startDate.split('-')[2] : 15);
        return `Esta ação está cadastrada todo dia ${dayNum} de cada mês ${periodText}.`;
      }
    }

    return `Esta ação está cadastrada ${periodText}.`;
  }

  openPublicCampaignsModal() {
    this.renderPublicCampaignsList();
    const btnAdminCamp = document.getElementById('btn-open-admin-campaigns');
    if (btnAdminCamp) {
      btnAdminCamp.classList.toggle('hidden', !this.store.isAdmin());
    }
    window.app?.openModal('modal-public-campaigns');
  }

  renderPublicCampaignsList() {
    const container = document.getElementById('public-campaigns-list-container');
    if (!container) return;
    container.innerHTML = '';

    const campaigns = this.store.getCampaigns();
    if (!campaigns || campaigns.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: #64748b;">
          <i data-lucide="target" style="width: 36px; height: 36px; opacity: 0.4; margin-bottom: 0.5rem;"></i>
          <p style="margin: 0; font-size: 0.9rem; font-weight: 600;">Nenhuma ação ou campanha cadastrada no momento.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    campaigns.forEach(c => {
      const detailText = this.formatCampaignDetailText(c);
      const itemEl = document.createElement('div');
      itemEl.style.cssText = 'display: flex; gap: 0.85rem; padding: 0.85rem 1rem; background: #ffffff; border-radius: 10px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05); align-items: flex-start;';

      itemEl.innerHTML = `
        <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${c.color || '#eab308'}; flex-shrink: 0; margin-top: 0.25rem;"></div>
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
            <h4 style="margin: 0; font-size: 0.95rem; font-weight: 800; color: #0f172a;">${c.title}</h4>
            <span style="font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 12px; background: rgba(234, 179, 8, 0.12); color: #b45309;">Ativa</span>
          </div>
          <p style="margin: 0.35rem 0 0 0; font-size: 0.83rem; color: #475569; font-weight: 500; line-height: 1.4;">
            ${detailText}
          </p>
        </div>
      `;

      container.appendChild(itemEl);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  openCampaignsModal() {
    this.resetCampaignForm();
    this.renderCampaignsList();
    window.app?.openModal('modal-campaigns');
  }

  renderCampaignsList() {
    const container = document.getElementById('campaigns-list-container');
    if (!container) return;
    container.innerHTML = '';

    const campaigns = this.store.getCampaigns();
    if (!campaigns || campaigns.length === 0) {
      container.innerHTML = '<span class="text-xs text-muted">Nenhuma ação cadastrada ainda.</span>';
      return;
    }

    campaigns.forEach(c => {
      const row = document.createElement('div');
      row.className = 'campaign-item-row';
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="width: 14px; height: 14px; border-radius: 50%; background-color: ${c.color || '#eab308'}; display: inline-block;"></span>
          <div>
            <h5 style="margin: 0; font-size: 0.85rem; font-weight: 700; color: #0f172a;">${c.title}</h5>
            <span style="font-size: 0.72rem; color: #64748b;">Início: ${c.startDate} ${c.endDate && c.endDate !== c.startDate ? `até ${c.endDate}` : ''}</span>
          </div>
        </div>
        <div style="display: flex; gap: 0.3rem;">
          <button type="button" class="btn-icon-sm btn-edit-camp" title="Editar" style="border: none; background: transparent; cursor: pointer; color: #0284c7;">
            <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
          </button>
          <button type="button" class="btn-icon-sm btn-del-camp" title="Excluir" style="border: none; background: transparent; cursor: pointer; color: #dc2626;">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      `;

      row.querySelector('.btn-edit-camp')?.addEventListener('click', () => {
        document.getElementById('campaign-id').value = c.id;
        document.getElementById('campaign-name').value = c.title;
        document.getElementById('campaign-recurrence').value = c.recurrenceType || 'CUSTOM_RANGE';
        document.getElementById('campaign-start-date').value = c.startDate || '';
        document.getElementById('campaign-end-date').value = c.endDate || '';
        document.getElementById('campaign-color-val').value = c.color || '#eab308';
        
        const titleEl = document.getElementById('form-campaign-title');
        if (titleEl) titleEl.textContent = '✏️ Editar Ação / Campanha';
        document.getElementById('btn-cancel-campaign-edit')?.classList.remove('hidden');

        // Toggle subfields
        const groupWeekdays = document.getElementById('group-specific-weekdays');
        const groupMonthly = document.getElementById('group-monthly-options');
        if (groupWeekdays) groupWeekdays.classList.toggle('hidden', c.recurrenceType !== 'WEEKDAYS_SPECIFIC');
        if (groupMonthly) groupMonthly.classList.toggle('hidden', c.recurrenceType !== 'MONTHLY');

        if (c.specificDays && Array.isArray(c.specificDays)) {
          document.querySelectorAll('#weekdays-chips-container .weekday-select-chip').forEach(btn => {
            if (c.specificDays.includes(btn.dataset.day)) btn.classList.add('selected');
            else btn.classList.remove('selected');
          });
        }

        if (c.monthlyMode) {
          const radio = document.querySelector(`input[name="monthly-mode"][value="${c.monthlyMode}"]`);
          if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
          }
        }
        if (c.monthlyDay) document.getElementById('campaign-monthly-day').value = c.monthlyDay;
        if (c.monthlyOrdinal) document.getElementById('campaign-monthly-ordinal').value = c.monthlyOrdinal;

        const colorContainer = document.getElementById('color-presets-container');
        if (colorContainer) {
          colorContainer.querySelectorAll('.color-preset-btn').forEach(b => {
            if (b.dataset.color === c.color) b.classList.add('active');
            else b.classList.remove('active');
          });
        }
      });

      row.querySelector('.btn-del-camp')?.addEventListener('click', () => {
        if (confirm(`Deseja excluir a ação "${c.title}"?`)) {
          this.store.deleteCampaign(c.id);
          this.renderCampaignsList();
          this.render();
          window.app?.showToast('Ação excluída.', 'info');
        }
      });

      container.appendChild(row);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  openMonthTeamModal() {
    const yearMonthKey = this.getYearMonthKey();
    const monthTitle = `${MONTH_NAMES[this.currentMonth - 1]} / ${this.currentYear}`;
    
    const titleEl = document.getElementById('month-team-modal-title');
    if (titleEl) titleEl.textContent = `Equipe de ${monthTitle}`;

    const container = document.getElementById('month-team-checklist-container');
    if (!container) return;
    container.innerHTML = '';
    container.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.65rem; max-height: 420px; overflow-y: auto; padding: 0.25rem;';

    const allActiveEmployees = this.store.getActiveEmployees();
    const selectedIds = this.store.getMonthSelectedEmployeeIds(yearMonthKey);

    const updateCount = () => {
      const checkedBoxes = container.querySelectorAll('.month-emp-checkbox:checked');
      const badge = document.getElementById('month-team-count-badge');
      if (badge) badge.textContent = `${checkedBoxes.length} colaboradores selecionados`;
    };

    allActiveEmployees.forEach(emp => {
      const isChecked = selectedIds.includes(emp.id);
      const itemEl = document.createElement('label');
      itemEl.className = 'month-team-check-row';
      itemEl.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.85rem; background: #f8fafc; border-radius: 8px; border: 1px solid #cbd5e1; cursor: pointer; transition: all 0.2s ease;';

      itemEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.65rem;">
          <input type="checkbox" class="month-emp-checkbox" value="${emp.id}" ${isChecked ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary);">
          <div class="emp-avatar-sm" style="background-color: ${emp.color || '#10b981'}; width: 28px; height: 28px; font-size: 0.75rem; font-weight: 800; color: #ffffff; display: flex; align-items: center; justify-content: center; border-radius: 50%;">
            ${emp.name.charAt(0)}
          </div>
          <div>
            <h4 style="margin: 0; font-size: 0.88rem; font-weight: 900; color: #0f172a;">${emp.name}</h4>
            <span style="font-size: 0.72rem; color: #475569; font-weight: 600;">${emp.role || 'Balconista'}</span>
          </div>
        </div>
        <span style="font-size: 0.72rem; color: ${emp.color || '#10b981'}; font-weight: 700;">
          ${emp.prefShift === 'NIGHT_WEEKDAY' ? 'Noite Seg-Qui' : (emp.prefShift === 'PLANTONISTA' ? 'Plantonista' : 'Rodízio')}
        </span>
      `;

      itemEl.querySelector('.month-emp-checkbox')?.addEventListener('change', updateCount);
      container.appendChild(itemEl);
    });

    updateCount();

    const btnSelectAll = document.getElementById('btn-select-all-month-team');
    if (btnSelectAll) {
      btnSelectAll.onclick = () => {
        container.querySelectorAll('.month-emp-checkbox').forEach(cb => { cb.checked = true; });
        updateCount();
      };
    }

    const btnUnselectAll = document.getElementById('btn-unselect-all-month-team');
    if (btnUnselectAll) {
      btnUnselectAll.onclick = () => {
        container.querySelectorAll('.month-emp-checkbox').forEach(cb => { cb.checked = false; });
        updateCount();
      };
    }

    window.app?.openModal('modal-month-team');
    if (window.lucide) window.lucide.createIcons();
  }

  saveMonthTeam() {
    const container = document.getElementById('month-team-checklist-container');
    if (!container) return;

    const checkedBoxes = container.querySelectorAll('.month-emp-checkbox:checked');
    const checkedIds = Array.from(checkedBoxes).map(cb => cb.value);

    if (checkedIds.length === 0) {
      window.app?.showToast('Selecione pelo menos 1 colaborador para a equipe deste mês.', 'warning');
      return;
    }

    const yearMonthKey = this.getYearMonthKey();
    this.store.setMonthSelectedEmployeeIds(yearMonthKey, checkedIds);
    window.app?.closeModal('modal-month-team');
    this.generateAndSaveCurrentMonth();
  }

  copyDaySchedule(dateKey, e) {
    if (e) e.stopPropagation();
    const yearMonthKey = this.getYearMonthKey();
    const schedule = this.store.getMonthSchedule(yearMonthKey);
    if (!schedule || !schedule.days || !schedule.days[dateKey]) {
      window.app?.showToast('Não há horários salvos neste dia para copiar.', 'warning');
      return;
    }

    const dayData = schedule.days[dateKey];
    const normalizedSlots = this.normalizeDaySlots(dayData.slots);
    const dayNumber = parseInt(dateKey.split('-')[2], 10);

    this.copiedDayData = {
      dateKey: dateKey,
      dayNumber: dayNumber,
      slots: JSON.parse(JSON.stringify(normalizedSlots))
    };

    window.copiedDayData = this.copiedDayData;
    this.updateCopyPasteUI();
    this.render();
    window.app?.showToast(`📋 Horário do dia ${String(dayNumber).padStart(2, '0')} copiado! Clique em 'Colar' nos dias desejados.`, 'info');
  }

  pasteDaySchedule(targetDateKey, e) {
    if (e) e.stopPropagation();
    if (!this.copiedDayData || !this.copiedDayData.slots) {
      window.app?.showToast('Nenhum horário copiado ainda. Clique em "Copiar" em algum dia primeiro.', 'warning');
      return;
    }

    const yearMonthKey = this.getYearMonthKey();
    let schedule = this.store.getMonthSchedule(yearMonthKey);
    if (!schedule) {
      schedule = this.getEmptyMonthSchedule(this.currentYear, this.currentMonth);
    }
    if (!schedule.days) schedule.days = {};

    const targetDayNumber = parseInt(targetDateKey.split('-')[2], 10);
    const dateObj = new Date(this.currentYear, this.currentMonth - 1, targetDayNumber);

    const clonedSlots = this.copiedDayData.slots.map(turnWorkers => ({
      workers: turnWorkers.map(w => ({ employeeName: w.employeeName, color: w.color || 'NORMAL' }))
    }));

    schedule.days[targetDateKey] = {
      dayNumber: targetDayNumber,
      dayOfWeek: dateObj.getDay(),
      slots: clonedSlots
    };

    this.store.saveMonthSchedule(yearMonthKey, schedule);
    this.render();
    window.app?.showToast(`📥 Horário colado com sucesso no dia ${String(targetDayNumber).padStart(2, '0')}!`, 'success');
  }

  pasteToWeekdaysOfWeek() {
    if (!this.copiedDayData || !this.copiedDayData.slots) {
      window.app?.showToast('Nenhum horário copiado.', 'warning');
      return;
    }

    const parts = this.copiedDayData.dateKey.split('-');
    const sourceYear = parseInt(parts[0], 10);
    const sourceMonth = parseInt(parts[1], 10);
    const sourceDay = parseInt(parts[2], 10);
    const sourceDate = new Date(sourceYear, sourceMonth - 1, sourceDay);
    const dayOfWeek = sourceDate.getDay();
    const diffToMon = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    const mondayDate = new Date(sourceDate);
    mondayDate.setDate(sourceDate.getDate() - diffToMon);

    const yearMonthKey = this.getYearMonthKey();
    let schedule = this.store.getMonthSchedule(yearMonthKey);
    if (!schedule) schedule = this.getEmptyMonthSchedule(this.currentYear, this.currentMonth);
    if (!schedule.days) schedule.days = {};

    let countPasted = 0;
    for (let i = 0; i < 5; i++) {
      const curDate = new Date(mondayDate);
      curDate.setDate(mondayDate.getDate() + i);

      if (curDate.getMonth() + 1 === this.currentMonth && curDate.getFullYear() === this.currentYear) {
        const dNum = curDate.getDate();
        const dKey = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
        
        const clonedSlots = this.copiedDayData.slots.map(turnWorkers => ({
          workers: turnWorkers.map(w => ({ employeeName: w.employeeName, color: w.color || 'NORMAL' }))
        }));

        schedule.days[dKey] = {
          dayNumber: dNum,
          dayOfWeek: curDate.getDay(),
          slots: clonedSlots
        };
        countPasted++;
      }
    }

    this.store.saveMonthSchedule(yearMonthKey, schedule);
    this.render();
    window.app?.showToast(`📥 Horário colado em ${countPasted} dias úteis desta semana!`, 'success');
  }

  pasteToAllWeekdaysOfMonth() {
    if (!this.copiedDayData || !this.copiedDayData.slots) {
      window.app?.showToast('Nenhum horário copiado.', 'warning');
      return;
    }

    const yearMonthKey = this.getYearMonthKey();
    let schedule = this.store.getMonthSchedule(yearMonthKey);
    if (!schedule) schedule = this.getEmptyMonthSchedule(this.currentYear, this.currentMonth);
    if (!schedule.days) schedule.days = {};

    const totalDays = new Date(this.currentYear, this.currentMonth, 0).getDate();
    let countPasted = 0;

    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(this.currentYear, this.currentMonth - 1, day);
      const dow = dateObj.getDay();
      if (dow >= 1 && dow <= 5) {
        const dKey = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const clonedSlots = this.copiedDayData.slots.map(turnWorkers => ({
          workers: turnWorkers.map(w => ({ employeeName: w.employeeName, color: w.color || 'NORMAL' }))
        }));

        schedule.days[dKey] = {
          dayNumber: day,
          dayOfWeek: dow,
          slots: clonedSlots
        };
        countPasted++;
      }
    }

    this.store.saveMonthSchedule(yearMonthKey, schedule);
    this.render();
    window.app?.showToast(`📥 Horário colado em todos os ${countPasted} dias úteis do mês!`, 'success');
  }

  cancelCopy() {
    this.copiedDayData = null;
    window.copiedDayData = null;
    this.updateCopyPasteUI();
    this.render();
    window.app?.showToast('Cópia cancelada.', 'info');
  }

  updateCopyPasteUI() {
    const toolbar = document.getElementById('copy-paste-toolbar');
    const label = document.getElementById('copied-day-label');
    const modalPasteBtn = document.getElementById('btn-modal-paste-day');

    if (this.copiedDayData && this.copiedDayData.slots) {
      if (toolbar) {
        toolbar.classList.remove('hidden');
        if (label) label.textContent = `Dia ${String(this.copiedDayData.dayNumber).padStart(2, '0')}`;
      }
      if (modalPasteBtn) {
        modalPasteBtn.removeAttribute('disabled');
        modalPasteBtn.classList.remove('disabled');
      }
    } else {
      if (toolbar) {
        toolbar.classList.add('hidden');
      }
      if (modalPasteBtn) {
        modalPasteBtn.setAttribute('disabled', 'true');
        modalPasteBtn.classList.add('disabled');
      }
    }
  }
}

window.CalendarManager = CalendarManager;
