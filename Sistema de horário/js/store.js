/**
 * STORE.JS - Gerenciamento de Estado e Persistência Local (LocalStorage)
 */

const STORAGE_KEYS = {
  EMPLOYEES: 'farmacia_escala_employees_v3',
  SCHEDULES: 'farmacia_escala_schedules_v18',
  ADMIN_PIN: 'farmacia_escala_admin_pin_v1',
  ADMIN_SESSION: 'farmacia_escala_admin_session_v1',
  CAMPAIGNS: 'farmacia_escala_campaigns_v1',
};

const DEFAULT_EMPLOYEES = [
  {
    id: 'emp-l2-1',
    name: 'LIVIA',
    role: 'Balconista (Novata)',
    prefShift: 'NONE',
    color: '#ec4899',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'emp-l2-2',
    name: 'MATHEUS',
    role: 'Balconista (Novato)',
    prefShift: 'NONE',
    color: '#0284c7',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'emp-l2-3',
    name: 'SALETE',
    role: 'Balconista (Experiente)',
    prefShift: 'NONE',
    color: '#10b981',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'emp-l2-4',
    name: 'NATÁLIA',
    role: 'Balconista (Experiente)',
    prefShift: 'NONE',
    color: '#8b5cf6',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'emp-l2-5',
    name: 'CARLOS',
    role: 'Plantonista',
    prefShift: 'PLANTONISTA',
    plantaoDays: ['SAT', 'SUN'],
    plantaoShift: '2',
    color: '#f97316',
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
      // 01 e 02/08: Fim de semana
      "2026-08-01": { dayNumber: 1, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'NATÁLIA', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'LIVIA', color: 'RED' }] }] },
      "2026-08-02": { dayNumber: 2, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'SALETE', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'RED' }] }] },

      // Semana 1 (03 a 09/08): Manhã (Matheus + Salete) / Noite (Livia + Natália) - 1ª Sexta (Folga Verde Livia)
      "2026-08-03": { dayNumber: 3, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-08-04": { dayNumber: 4, dayOfWeek: 2, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-08-05": { dayNumber: 5, dayOfWeek: 3, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-08-06": { dayNumber: 6, dayOfWeek: 4, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-08-07": { dayNumber: 7, dayOfWeek: 5, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [{ employeeName: 'LIVIA', color: 'GREEN' }] }, { workers: [{ employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-08-08": { dayNumber: 8, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'SALETE', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'RED' }] }] },
      "2026-08-09": { dayNumber: 9, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'NATÁLIA', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'LIVIA', color: 'RED' }] }] },

      // Semana 2 (10 a 16/08): Manhã (Livia + Natália) / Noite (Matheus + Salete) - 2ª Sexta (Folga Verde Matheus)
      "2026-08-10": { dayNumber: 10, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-08-11": { dayNumber: 11, dayOfWeek: 2, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-08-12": { dayNumber: 12, dayOfWeek: 3, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-08-13": { dayNumber: 13, dayOfWeek: 4, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-08-14": { dayNumber: 14, dayOfWeek: 5, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'GREEN' }] }, { workers: [{ employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-08-15": { dayNumber: 15, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'NATÁLIA', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'LIVIA', color: 'RED' }] }] },
      "2026-08-16": { dayNumber: 16, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'SALETE', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'RED' }] }] },

      // Semana 3 (17 a 23/08): Manhã (Matheus + Salete) / Noite (Livia + Natália) - 3ª Sexta (Folga Verde Natália)
      "2026-08-17": { dayNumber: 17, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-08-18": { dayNumber: 18, dayOfWeek: 2, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-08-19": { dayNumber: 19, dayOfWeek: 3, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-08-20": { dayNumber: 20, dayOfWeek: 4, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-08-21": { dayNumber: 21, dayOfWeek: 5, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [{ employeeName: 'NATÁLIA', color: 'GREEN' }] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }] }] },
      "2026-08-22": { dayNumber: 22, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'SALETE', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'RED' }] }] },
      "2026-08-23": { dayNumber: 23, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'NATÁLIA', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'LIVIA', color: 'RED' }] }] },

      // Semana 4 (24 a 30/08): Fiel à Imagem Real - Manhã (Livia + Natália) / Noite (Matheus + Salete)
      "2026-08-24": { dayNumber: 24, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-08-25": { dayNumber: 25, dayOfWeek: 2, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-08-26": { dayNumber: 26, dayOfWeek: 3, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-08-27": { dayNumber: 27, dayOfWeek: 4, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-08-28": { dayNumber: 28, dayOfWeek: 5, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-08-29": { dayNumber: 29, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'SALETE', color: 'RED' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }] },
      "2026-08-30": { dayNumber: 30, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'NATÁLIA', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'LIVIA', color: 'RED' }] }] },

      // Semana 5 (31/08): Fiel à Imagem Real - Inversão na Segunda: Manhã (Matheus + Salete) / Noite (Livia + Natália)
      "2026-08-31": { dayNumber: 31, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] }
    };
    return {
      yearMonth: '2026-08',
      year: 2026,
      month: 8,
      generatedAt: new Date().toISOString(),
      days: days
    };
  }

  getDefaultSeptember2026Schedule() {
    const days = {
      // Semana 1 (01 a 06/09) - Ciclo A: Manhã (Matheus + Salete) / Noite (Livia + Natália) - 1ª Sexta (Folga Verde Livia)
      "2026-09-01": { dayNumber: 1, dayOfWeek: 2, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-09-02": { dayNumber: 2, dayOfWeek: 3, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-09-03": { dayNumber: 3, dayOfWeek: 4, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-09-04": { dayNumber: 4, dayOfWeek: 5, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [{ employeeName: 'LIVIA', color: 'GREEN' }] }, { workers: [{ employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-09-05": { dayNumber: 5, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'SALETE', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'RED' }] }] },
      "2026-09-06": { dayNumber: 6, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'NATÁLIA', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'LIVIA', color: 'RED' }] }] },

      // Semana 2 (07 a 13/09) - Ciclo B (Cruzamento): Manhã (Livia + Salete) / Noite (Matheus + Natália) - 2ª Sexta (Folga Verde Matheus)
      "2026-09-07": { dayNumber: 7, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-09-08": { dayNumber: 8, dayOfWeek: 2, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-09-09": { dayNumber: 9, dayOfWeek: 3, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-09-10": { dayNumber: 10, dayOfWeek: 4, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-09-11": { dayNumber: 11, dayOfWeek: 5, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'GREEN' }] }, { workers: [{ employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-09-12": { dayNumber: 12, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'SALETE', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'LIVIA', color: 'RED' }] }] },
      "2026-09-13": { dayNumber: 13, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'NATÁLIA', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'RED' }] }] },

      // Semana 3 (14 a 20/09) - Ciclo B (Inversão): Manhã (Matheus + Natália) / Noite (Livia + Salete) - 3ª Sexta (Folga Verde Salete)
      "2026-09-14": { dayNumber: 14, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-09-15": { dayNumber: 15, dayOfWeek: 2, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-09-16": { dayNumber: 16, dayOfWeek: 3, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-09-17": { dayNumber: 17, dayOfWeek: 4, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-09-18": { dayNumber: 18, dayOfWeek: 5, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [{ employeeName: 'SALETE', color: 'GREEN' }] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }] }] },
      "2026-09-19": { dayNumber: 19, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'NATÁLIA', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'RED' }] }] },
      "2026-09-20": { dayNumber: 20, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'SALETE', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'LIVIA', color: 'RED' }] }] },

      // Semana 4 (21 a 27/09) - Ciclo A (Retorno): Manhã (Livia + Natália) / Noite (Matheus + Salete) - 4ª Sexta (Folga Verde Natália)
      "2026-09-21": { dayNumber: 21, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-09-22": { dayNumber: 22, dayOfWeek: 2, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-09-23": { dayNumber: 23, dayOfWeek: 3, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-09-24": { dayNumber: 24, dayOfWeek: 4, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-09-25": { dayNumber: 25, dayOfWeek: 5, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }] }, { workers: [{ employeeName: 'NATÁLIA', color: 'GREEN' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-09-26": { dayNumber: 26, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'NATÁLIA', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'LIVIA', color: 'RED' }] }] },
      "2026-09-27": { dayNumber: 27, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'SALETE', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'RED' }] }] },

      // Semana 5 (28 a 30/09) - Ciclo A: Manhã (Matheus + Salete) / Noite (Livia + Natália)
      "2026-09-28": { dayNumber: 28, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-09-29": { dayNumber: 29, dayOfWeek: 2, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-09-30": { dayNumber: 30, dayOfWeek: 3, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] }
    };
    return {
      yearMonth: '2026-09',
      year: 2026,
      month: 9,
      generatedAt: new Date().toISOString(),
      days: days
    };
  }

  getDefaultOctober2026Schedule() {
    const days = {
      // Semana 1 (01 a 04/10) - Continuação da Semana 5 de Setembro (Ciclo A): Manhã (Matheus + Salete) / Noite (Livia + Natália) - 1ª Sexta (Folga Verde Livia)
      "2026-10-01": { dayNumber: 1, dayOfWeek: 4, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-10-02": { dayNumber: 2, dayOfWeek: 5, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [{ employeeName: 'LIVIA', color: 'GREEN' }] }, { workers: [{ employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-10-03": { dayNumber: 3, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'SALETE', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'RED' }] }] },
      "2026-10-04": { dayNumber: 4, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'NATÁLIA', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'LIVIA', color: 'RED' }] }] },

      // Semana 2 (05 a 11/10) - Ciclo B: Manhã (Livia + Salete) / Noite (Matheus + Natália) - 2ª Sexta (Folga Verde Matheus)
      "2026-10-05": { dayNumber: 5, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-10-06": { dayNumber: 6, dayOfWeek: 2, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-10-07": { dayNumber: 7, dayOfWeek: 3, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-10-08": { dayNumber: 8, dayOfWeek: 4, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-10-09": { dayNumber: 9, dayOfWeek: 5, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'GREEN' }] }, { workers: [{ employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-10-10": { dayNumber: 10, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'SALETE', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'LIVIA', color: 'RED' }] }] },
      "2026-10-11": { dayNumber: 11, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'NATÁLIA', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'RED' }] }] },

      // Semana 3 (12 a 18/10) - Ciclo B (Inversão): Manhã (Matheus + Natália) / Noite (Livia + Salete) - 3ª Sexta (Folga Verde Salete)
      "2026-10-12": { dayNumber: 12, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-10-13": { dayNumber: 13, dayOfWeek: 2, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-10-14": { dayNumber: 14, dayOfWeek: 3, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-10-15": { dayNumber: 15, dayOfWeek: 4, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-10-16": { dayNumber: 16, dayOfWeek: 5, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [{ employeeName: 'SALETE', color: 'GREEN' }] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }] }] },
      "2026-10-17": { dayNumber: 17, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'NATÁLIA', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'RED' }] }] },
      "2026-10-18": { dayNumber: 18, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'SALETE', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'LIVIA', color: 'RED' }] }] },

      // Semana 4 (19 a 25/10) - Ciclo A (Retorno): Manhã (Livia + Natália) / Noite (Matheus + Salete) - 4ª Sexta (Folga Verde Natália)
      "2026-10-19": { dayNumber: 19, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-10-20": { dayNumber: 20, dayOfWeek: 2, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-10-21": { dayNumber: 21, dayOfWeek: 3, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-10-22": { dayNumber: 22, dayOfWeek: 4, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-10-23": { dayNumber: 23, dayOfWeek: 5, slots: [{ workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }] }, { workers: [{ employeeName: 'NATÁLIA', color: 'GREEN' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }] },
      "2026-10-24": { dayNumber: 24, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'NATÁLIA', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'LIVIA', color: 'RED' }] }] },
      "2026-10-25": { dayNumber: 25, dayOfWeek: 0, slots: [{ workers: [{ employeeName: 'SALETE', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'RED' }] }] },

      // Semana 5 (26 a 31/10) - Ciclo A: Manhã (Matheus + Salete) / Noite (Livia + Natália)
      "2026-10-26": { dayNumber: 26, dayOfWeek: 1, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-10-27": { dayNumber: 27, dayOfWeek: 2, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-10-28": { dayNumber: 28, dayOfWeek: 3, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-10-29": { dayNumber: 29, dayOfWeek: 4, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-10-30": { dayNumber: 30, dayOfWeek: 5, slots: [{ workers: [{ employeeName: 'MATHEUS', color: 'NORMAL' }, { employeeName: 'SALETE', color: 'NORMAL' }] }, { workers: [] }, { workers: [{ employeeName: 'LIVIA', color: 'NORMAL' }, { employeeName: 'NATÁLIA', color: 'NORMAL' }] }] },
      "2026-10-31": { dayNumber: 31, dayOfWeek: 6, slots: [{ workers: [{ employeeName: 'SALETE', color: 'RED' }] }, { workers: [{ employeeName: 'CARLOS', color: 'RED' }] }, { workers: [{ employeeName: 'MATHEUS', color: 'RED' }] }] }
    };
    return {
      yearMonth: '2026-10',
      year: 2026,
      month: 10,
      generatedAt: new Date().toISOString(),
      days: days
    };
  }

  init() {
    const l1Names = ['MAURICIO', 'MAURÍCIO', 'LILIAN', 'DJANE'];

    // Se não tiver funcionários salvos ou só tiver dados vazios/da L1, inicializa a equipe L2
    let storedEmps = [];
    try {
      storedEmps = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
    } catch (e) {
      storedEmps = [];
    }
    storedEmps = storedEmps.filter(emp => !l1Names.includes((emp.name || '').trim().toUpperCase()));
    if (storedEmps.length === 0) {
      storedEmps = DEFAULT_EMPLOYEES;
    }
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(storedEmps));

    // Inicializa escalas
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
    if (!existingSchedules['2026-10']) {
      existingSchedules['2026-10'] = this.getDefaultOctober2026Schedule();
      schedulesModified = true;
    }
    if (!existingSchedules['2026-09']) {
      existingSchedules['2026-09'] = this.getDefaultSeptember2026Schedule();
      schedulesModified = true;
    }
    if (!existingSchedules['2026-08'] || (existingSchedules['2026-08'].days && !Object.values(existingSchedules['2026-08'].days).some(d => d.slots?.some(s => s.workers?.length > 0)))) {
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
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(DEFAULT_EMPLOYEES));
    const schedules = {
      '2026-08': this.getDefaultAugust2026Schedule(),
      '2026-09': this.getDefaultSeptember2026Schedule()
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
