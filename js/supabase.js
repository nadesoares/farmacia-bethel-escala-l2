/**
 * SUPABASE.JS - Conexão e Sincronização com o Banco de Dados Cloud (Supabase)
 */

const SUPABASE_STORAGE_KEYS = {
  URL: 'bethel_supabase_url',
  KEY: 'bethel_supabase_key'
};

class SupabaseManager {
  constructor() {
    this.client = null;
    this.init();
  }

  init() {
    const url = localStorage.getItem(SUPABASE_STORAGE_KEYS.URL);
    const key = localStorage.getItem(SUPABASE_STORAGE_KEYS.KEY);

    if (url && key && window.supabase) {
      try {
        this.client = window.supabase.createClient(url, key);
      } catch (err) {
        console.error('Erro ao inicializar cliente Supabase:', err);
        this.client = null;
      }
    }
  }

  isConfigured() {
    return Boolean(this.client);
  }

  getCredentials() {
    return {
      url: localStorage.getItem(SUPABASE_STORAGE_KEYS.URL) || '',
      key: localStorage.getItem(SUPABASE_STORAGE_KEYS.KEY) || ''
    };
  }

  saveCredentials(url, key) {
    if (!url || !key) {
      localStorage.removeItem(SUPABASE_STORAGE_KEYS.URL);
      localStorage.removeItem(SUPABASE_STORAGE_KEYS.KEY);
      this.client = null;
      return false;
    }

    localStorage.setItem(SUPABASE_STORAGE_KEYS.URL, url.trim());
    localStorage.setItem(SUPABASE_STORAGE_KEYS.KEY, key.trim());
    this.init();
    return this.isConfigured();
  }

  /**
   * Carrega lista de funcionários do Supabase
   */
  async fetchEmployees() {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await this.client
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) throw error;
      if (!data || data.length === 0) return null;

      return data.map(item => ({
        id: item.id,
        name: item.name,
        role: item.role,
        prefShift: item.pref_shift || 'NONE',
        color: item.color || '#0284c7',
        status: item.status || 'ACTIVE',
        createdAt: item.created_at
      }));
    } catch (err) {
      console.warn('Erro ao buscar funcionários no Supabase:', err.message);
      return null;
    }
  }

  /**
   * Salva lista completa de funcionários no Supabase
   */
  async saveEmployees(employeesList) {
    if (!this.isConfigured()) return false;
    try {
      const payload = employeesList.map(emp => ({
        id: emp.id,
        name: emp.name,
        role: emp.role || 'Balconista',
        pref_shift: emp.prefShift || 'NONE',
        color: emp.color || '#0284c7',
        status: emp.status || 'ACTIVE',
        updated_at: new Date().toISOString()
      }));

      const { error } = await this.client
        .from('employees')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Erro ao salvar funcionários no Supabase:', err.message);
      return false;
    }
  }

  /**
   * Carrega a escala de um mês específico
   */
  async fetchSchedule(yearMonthKey) {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await this.client
        .from('schedules')
        .select('schedule_data')
        .eq('year_month', yearMonthKey)
        .maybeSingle();

      if (error) throw error;
      if (data && data.schedule_data) {
        return data.schedule_data;
      }
      return null;
    } catch (err) {
      console.warn(`Erro ao buscar escala ${yearMonthKey} no Supabase:`, err.message);
      return null;
    }
  }

  /**
   * Salva a escala de um mês específico no Supabase
   */
  async saveSchedule(yearMonthKey, scheduleData) {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await this.client
        .from('schedules')
        .upsert({
          year_month: yearMonthKey,
          schedule_data: scheduleData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'year_month' });

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn(`Erro ao salvar escala ${yearMonthKey} no Supabase:`, err.message);
      return false;
    }
  }
}

window.supabaseManager = new SupabaseManager();
