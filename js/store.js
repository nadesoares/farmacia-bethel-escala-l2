/**
 * STORE.JS - Gerenciamento de Estado e Persistência Local (LocalStorage)
 */

const STORAGE_KEYS = {
  EMPLOYEES: 'farmacia_escala_l2_employees_v1',
  SCHEDULES: 'farmacia_escala_l2_schedules_v1',
  ADMIN_PIN: 'farmacia_escala_admin_pin_v1',
  ADMIN_SESSION: 'farmacia_escala_admin_session_v1',
};

const DEFAULT_EMPLOYEES = [];

class Store {
  constructor() {
    this.init();
  }

  getDefaultAugust2026Schedule() {
    return null;
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(DEFAULT_EMPLOYEES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ADMIN_PIN)) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, '1234');
    }
  }

  resetDefaultEmployees() {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify({}));
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
    const savedPin = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '1234';
    if (pin === savedPin) {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
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
}

const store = new Store();
window.store = store;
