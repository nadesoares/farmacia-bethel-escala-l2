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

const DEFAULT_EMPLOYEES = [
  {
    id: 'emp-1',
    name: 'MAURICIO',
    role: 'Balconista',
    prefShift: 'NONE',
    color: '#0284c7',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'emp-2',
    name: 'LILIAN',
    role: 'Balconista',
    prefShift: 'NONE',
    color: '#ec4899',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'emp-3',
    name: 'DJANE',
    role: 'Balconista',
    prefShift: 'NIGHT_WEEKDAY',
    color: '#10b981',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  }
];

class Store {
  constructor() {
    this.init();
  }

  getDefaultAugust2026Schedule() {
    const days = {
      "2026-08-01": { dayNumber: 1, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'DJANE', color: 'RED' }] }, { workers: [] }, { workers: [{ employeeName: 'LILIAN', color: 'RED' }] }] },
      "2026-08-02": { dayNumber: 2, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'MAURICIO', color: 'RED' }] }, { workers: [] }, { workers: [] }] },
      "2026-08-03": { dayNumber: 3, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'LILIAN', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'MAURICIO', color: 'NORMAL' }] }] },
      "2026-08-04": { dayNumber: 4, dayOfWeek: 2, slots: [{ workers: [{ employeeName: 'LILIAN', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'MAURICIO', color: 'NORMAL' }] }] },
      "2026-08-05": { dayNumber: 5, dayOfWeek: 3, slots: [{ workers: [{ employeeName: 'LILIAN', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'MAURICIO', color: 'NORMAL' }] }] },
      "2026-08-06": { dayNumber: 6, dayOfWeek: 4, slots: [{ workers: [{ employeeName: 'LILIAN', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'MAURICIO', color: 'NORMAL' }] }] },
      "2026-08-07": { dayNumber: 7, dayOfWeek: 5, slots: [{ workers: [{ employeeName: 'DJANE', color: 'GREEN' }, { employeeName: 'MAURICIO', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LILIAN', color: 'NORMAL' }] }] },
      "2026-08-08": { dayNumber: 8, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'MAURICIO', color: 'RED' }] }, { workers: [] }, { workers: [{ employeeName: 'LILIAN', color: 'RED' }] }] },
      "2026-08-09": { dayNumber: 9, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'DJANE', color: 'RED' }] }, { workers: [] }, { workers: [] }] },
      "2026-08-10": { dayNumber: 10, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'MAURICIO', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'LILIAN', color: 'NORMAL' }] }] },
      "2026-08-11": { dayNumber: 11, dayOfWeek: 2, slots: [{ workers: [{ employeeName: 'MAURICIO', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'LILIAN', color: 'NORMAL' }] }] },
      "2026-08-12": { dayNumber: 12, dayOfWeek: 3, slots: [{ workers: [{ employeeName: 'MAURICIO', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'LILIAN', color: 'NORMAL' }] }] },
      "2026-08-13": { dayNumber: 13, dayOfWeek: 4, slots: [{ workers: [{ employeeName: 'MAURICIO', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'LILIAN', color: 'NORMAL' }] }] },
      "2026-08-14": { dayNumber: 14, dayOfWeek: 5, slots: [{ workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'LILIAN', color: 'GREEN' }] }, { workers: [] }, { workers: [{ employeeName: 'MAURICIO', color: 'NORMAL' }] }] },
      "2026-08-15": { dayNumber: 15, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'DJANE', color: 'RED' }] }, { workers: [] }, { workers: [{ employeeName: 'MAURICIO', color: 'RED' }] }] },
      "2026-08-16": { dayNumber: 16, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'LILIAN', color: 'RED' }] }, { workers: [] }, { workers: [] }] },
      "2026-08-17": { dayNumber: 17, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'LILIAN', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'MAURICIO', color: 'NORMAL' }] }] },
      "2026-08-18": { dayNumber: 18, dayOfWeek: 2, slots: [{ workers: [{ employeeName: 'LILIAN', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'MAURICIO', color: 'NORMAL' }] }] },
      "2026-08-19": { dayNumber: 19, dayOfWeek: 3, slots: [{ workers: [{ employeeName: 'LILIAN', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'MAURICIO', color: 'NORMAL' }] }] },
      "2026-08-20": { dayNumber: 20, dayOfWeek: 4, slots: [{ workers: [{ employeeName: 'LILIAN', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'MAURICIO', color: 'NORMAL' }] }] },
      "2026-08-21": { dayNumber: 21, dayOfWeek: 5, slots: [{ workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'MAURICIO', color: 'GREEN' }] }, { workers: [] }, { workers: [{ employeeName: 'LILIAN', color: 'NORMAL' }] }] },
      "2026-08-22": { dayNumber: 22, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'LILIAN', color: 'RED' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'RED' }] }] },
      "2026-08-23": { dayNumber: 23, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'MAURICIO', color: 'RED' }] }, { workers: [] }, { workers: [] }] },
      "2026-08-24": { dayNumber: 24, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'MAURICIO', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'LILIAN', color: 'NORMAL' }] }] },
      "2026-08-25": { dayNumber: 25, dayOfWeek: 2, slots: [{ workers: [{ employeeName: 'MAURICIO', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'LILIAN', color: 'NORMAL' }] }] },
      "2026-08-26": { dayNumber: 26, dayOfWeek: 3, slots: [{ workers: [{ employeeName: 'MAURICIO', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'LILIAN', color: 'NORMAL' }] }] },
      "2026-08-27": { dayNumber: 27, dayOfWeek: 4, slots: [{ workers: [{ employeeName: 'MAURICIO', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'LILIAN', color: 'NORMAL' }] }] },
      "2026-08-28": { dayNumber: 28, dayOfWeek: 5, slots: [{ workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'LILIAN', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MAURICIO', color: 'NORMAL' }] }] },
      "2026-08-29": { dayNumber: 29, dayOfWeek: 6, slots: [{ workers: [] }, { workers: [] }, { workers: [{ employeeName: 'MAURICIO', color: 'RED' }] }] },
      "2026-08-30": { dayNumber: 30, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'LILIAN', color: 'RED' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'RED' }] }] },
      "2026-08-31": { dayNumber: 31, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'LILIAN', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'DJANE', color: 'NORMAL' }, { employeeName: 'MAURICIO', color: 'NORMAL' }] }] }
    };
    return {
      yearMonth: '2026-08',
      year: 2026,
      month: 8,
      generatedAt: '2026-08-01T00:00:00.000Z',
      days: days
    };
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(DEFAULT_EMPLOYEES));
    }
    const existingSchedules = this.getAllSchedules();
    if (!existingSchedules['2026-07']) {
      try {
        if (window.PharmacyScheduler) {
          const scheduler = new window.PharmacyScheduler(this);
          existingSchedules['2026-07'] = scheduler.generateMonthSchedule(2026, 7);
          localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(existingSchedules));
        }
      } catch (e) {
        console.warn('Auto-geração de Julho/2026:', e);
      }
    }
    if (!existingSchedules['2026-08']) {
      existingSchedules['2026-08'] = this.getDefaultAugust2026Schedule();
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(existingSchedules));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) === '1234') {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, 'Bd@9998');
    }
  }

  resetDefaultEmployees() {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(DEFAULT_EMPLOYEES));
    const schedules = {
      '2026-08': this.getDefaultAugust2026Schedule()
    };
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
    return DEFAULT_EMPLOYEES;
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
    const savedPin = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || 'Bd@9998';
    if (pin === 'Bd@9998' || pin === savedPin) {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
      localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, 'Bd@9998');
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
