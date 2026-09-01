/**
 * STORE.JS - Gerenciamento de Estado e Persistência Local (LocalStorage)
 */

const STORAGE_KEYS = {
  EMPLOYEES: 'farmacia_escala_employees_v3',
  SCHEDULES: 'farmacia_escala_schedules_v17',
  ADMIN_PIN: 'farmacia_escala_admin_pin_v1',
  ADMIN_SESSION: 'farmacia_escala_admin_session_v1',
  CAMPAIGNS: 'farmacia_escala_campaigns_v1',
};

const DEFAULT_EMPLOYEES = [];

class Store {
  constructor() {
    this.init();
  }

  getDefaultAugust2026Schedule() {
    const days = {};
    for (let d = 1; d <= 31; d++) {
      const dateStr = `2026-08-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(2026, 7, d).getDay();
      days[dateStr] = {
        dayNumber: d,
        dayOfWeek: dayOfWeek,
        slots: [{ workers: [] }, { workers: [] }, { workers: [] }]
      };
    }
    return {
      yearMonth: '2026-08',
      year: 2026,
      month: 8,
      generatedAt: new Date().toISOString(),
      days: days
    };
  }

  init() {
    const l1Names = ['MAURICIO', 'MAURÍCIO', 'LILIAN', 'DJANE'];

    // Limpar funcionários do L1 do armazenamento local do L2
    let storedEmps = [];
    try {
      storedEmps = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
    } catch (e) {
      storedEmps = [];
    }
    storedEmps = storedEmps.filter(emp => !l1Names.includes((emp.name || '').trim().toUpperCase()));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(storedEmps));

    // Limpar escalas existentes removendo colaboradores do L1
    const existingSchedules = this.getAllSchedules();
    let schedulesModified = false;
    for (const ym in existingSchedules) {
      if (existingSchedules[ym]?.days) {
        for (const dateKey in existingSchedules[ym].days) {
          const day = existingSchedules[ym].days[dateKey];
          if (day.slots) {
            day.slots.forEach(slot => {
              if (slot.workers && slot.workers.length > 0) {
                const prevCount = slot.workers.length;
                slot.workers = slot.workers.filter(w => !l1Names.includes((w.employeeName || '').trim().toUpperCase()));
                if (slot.workers.length !== prevCount) {
                  schedulesModified = true;
                }
              }
            });
          }
        }
      }
    }
    if (!existingSchedules['2026-08']) {
      existingSchedules['2026-08'] = this.getDefaultAugust2026Schedule();
      schedulesModified = true;
    }
    if (schedulesModified) {
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(existingSchedules));
    }

    if (!localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) === '1234' || localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) === 'Bd@9998') {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, 'Pf@99947');
    }
  }

  resetDefaultEmployees() {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify([]));
    const schedules = {
      '2026-08': this.getDefaultAugust2026Schedule()
    };
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
    return [];
  }

  getEmployees() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      return data ? JSON.parse(data) : DEFAULT_EMPLOYEES;
    } catch (e) {
      console.error('Erro ao ler funcionários:', e);
      return DEFAULT_EMPLOYEES;
    }
  }

  getActiveEmployees() {
    return this.getEmployees().filter(emp => emp.status === 'ACTIVE');
  }

  getEmployeeById(id) {
    return this.getEmployees().find(emp => emp.id === id);
  }

  saveEmployee(employeeData) {
    const employees = this.getEmployees();
    if (employeeData.id) {
      const index = employees.findIndex(e => e.id === employeeData.id);
      if (index !== -1) {
        employees[index] = { ...employees[index], ...employeeData, updatedAt: new Date().toISOString() };
      }
    } else {
      const newEmp = {
        ...employeeData,
        id: 'emp-' + Date.now(),
        name: employeeData.name.toUpperCase().trim(),
        createdAt: new Date().toISOString()
      };
      employees.push(newEmp);
    }
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    if (window.supabaseManager?.isConfigured()) {
      window.supabaseManager.saveEmployees(employees);
    }
    return employees;
  }

  deleteEmployee(id) {
    const employees = this.getEmployees();
    const index = employees.findIndex(e => e.id === id);
    if (index !== -1) {
      employees[index].status = 'INACTIVE';
      employees[index].updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
      if (window.supabaseManager?.isConfigured()) {
        window.supabaseManager.saveEmployees(employees);
      }
    }
    return employees;
  }

  toggleEmployeeStatus(id) {
    const employees = this.getEmployees();
    const index = employees.findIndex(e => e.id === id);
    if (index !== -1) {
      employees[index].status = (employees[index].status === 'ACTIVE') ? 'INACTIVE' : 'ACTIVE';
      employees[index].updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
      if (window.supabaseManager?.isConfigured()) {
        window.supabaseManager.saveEmployees(employees);
      }
    }
    return employees;
  }

  getMonthSelectedEmployeeIds(yearMonthKey) {
    const schedule = this.getMonthSchedule(yearMonthKey);
    if (schedule && Array.isArray(schedule.selectedEmployeeIds) && schedule.selectedEmployeeIds.length > 0) {
      return schedule.selectedEmployeeIds;
    }
    // Padrão: todos os colaboradores que estiverem ativos no cadastro
    return this.getActiveEmployees().map(e => e.id);
  }

  setMonthSelectedEmployeeIds(yearMonthKey, employeeIds) {
    let schedule = this.getMonthSchedule(yearMonthKey);
    if (!schedule) {
      const [year, month] = yearMonthKey.split('-').map(Number);
      schedule = {
        yearMonth: yearMonthKey,
        year: year,
        month: month,
        days: {}
      };
    }
    schedule.selectedEmployeeIds = employeeIds;
    this.saveMonthSchedule(yearMonthKey, schedule);
    return schedule;
  }

  getMonthEmployees(yearMonthKey) {
    const selectedIds = this.getMonthSelectedEmployeeIds(yearMonthKey);
    const allEmployees = this.getEmployees();
    const selected = allEmployees.filter(e => selectedIds.includes(e.id) && e.status === 'ACTIVE');
    return selected.length > 0 ? selected : this.getActiveEmployees();
  }

  getAllSchedules() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Erro ao ler escalas:', e);
      return {};
    }
  }

  getMonthSchedule(yearMonthKey) {
    const schedules = this.getAllSchedules();
    return schedules[yearMonthKey] || null;
  }

  saveMonthSchedule(yearMonthKey, scheduleData) {
    const schedules = this.getAllSchedules();
    const existing = schedules[yearMonthKey];
    if (existing && Array.isArray(existing.selectedEmployeeIds) && existing.selectedEmployeeIds.length > 0 && (!scheduleData.selectedEmployeeIds || scheduleData.selectedEmployeeIds.length === 0)) {
      scheduleData.selectedEmployeeIds = existing.selectedEmployeeIds;
    }
    schedules[yearMonthKey] = scheduleData;
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
    if (window.supabaseManager?.isConfigured()) {
      window.supabaseManager.saveSchedule(yearMonthKey, scheduleData);
    }
  }

  async syncFromSupabase() {
    if (!window.supabaseManager?.isConfigured()) return false;
    try {
      const remoteEmps = await window.supabaseManager.fetchEmployees();
      if (remoteEmps && remoteEmps.length > 0) {
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(remoteEmps));
      }
      return true;
    } catch (err) {
      console.warn('Erro ao sincronizar do Supabase:', err);
      return false;
    }
  }

  deleteMonthSchedule(yearMonthKey) {
    const schedules = this.getAllSchedules();
    delete schedules[yearMonthKey];
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  }

  isAdmin() {
    return sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) === 'true';
  }

  loginAdmin(pin) {
    const savedPin = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || 'Pf@99947';
    if (pin === 'Pf@99947' || pin === savedPin) {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
      localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, 'Pf@99947');
      return true;
    }
    return false;
  }

  logoutAdmin() {
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  }

  setAdminPin(newPin) {
    if (newPin && newPin.length >= 4) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, newPin);
      return true;
    }
    return false;
  }

  // --- GERENCIAMENTO DE AÇÕES / CAMPANHAS DA FARMÁCIA ---
  getCampaigns() {
    const raw = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
    if (!raw) {
      return [];
    }
    try {
      const list = JSON.parse(raw);
      return list.filter(c => c.id !== 'camp-setembro-amarelo');
    } catch (e) {
      return [];
    }
  }

  saveCampaign(campaign) {
    const campaigns = this.getCampaigns();
    if (!campaign.id) {
      campaign.id = 'camp-' + Date.now();
      campaign.createdAt = new Date().toISOString();
      campaigns.push(campaign);
    } else {
      const index = campaigns.findIndex(c => c.id === campaign.id);
      if (index !== -1) {
        campaigns[index] = { ...campaigns[index], ...campaign };
      } else {
        campaigns.push(campaign);
      }
    }
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
    return campaign;
  }

  deleteCampaign(id) {
    let campaigns = this.getCampaigns();
    campaigns = campaigns.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
  }
}

const store = new Store();
window.store = store;
