/**
 * EMPLOYEES.JS - Cadastro e Gestão de Funcionários com Escolha de Turno e Plantonista
 */

class EmployeeManager {
  constructor(store) {
    this.store = store;
    this.init();
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    const btnAdd = document.getElementById('btn-add-employee');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => this.openAddModal());
    }

    const btnReset = document.getElementById('btn-reset-default-team');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Deseja restaurar a equipe padrão (MAURICIO, LILIAN e DJANE)?')) {
          this.store.resetDefaultEmployees();
          this.render();
          if (window.calendarManager) {
            window.calendarManager.renderFilterOptions();
            window.calendarManager.generateAndSaveCurrentMonth();
          }
          window.app?.showToast('Equipe padrão restaurada!', 'success');
        }
      });
    }

    const formEmp = document.getElementById('form-employee');
    if (formEmp) {
      formEmp.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveEmployee();
      });
    }

    const colorInput = document.getElementById('employee-color');
    const colorPreview = document.getElementById('employee-color-preview');
    if (colorInput && colorPreview) {
      colorInput.addEventListener('input', (e) => {
        colorPreview.textContent = e.target.value;
      });
    }

    // Toggle de opções de Plantonista
    const prefShiftSelect = document.getElementById('employee-pref-shift');
    if (prefShiftSelect) {
      prefShiftSelect.addEventListener('change', (e) => {
        const plantonistaContainer = document.getElementById('plantonista-options-container');
        if (plantonistaContainer) {
          if (e.target.value === 'PLANTONISTA') {
            plantonistaContainer.classList.remove('hidden');
          } else {
            plantonistaContainer.classList.add('hidden');
          }
        }
      });
    }
  }

  openAddModal() {
    document.getElementById('employee-modal-title').textContent = 'Novo Colaborador';
    document.getElementById('employee-id').value = '';
    document.getElementById('employee-name').value = '';
    document.getElementById('employee-pref-shift').value = 'NONE';
    document.getElementById('employee-color').value = '#10b981';
    document.getElementById('employee-color-preview').textContent = '#10b981';
    document.getElementById('employee-status').value = 'ACTIVE';

    const plantonistaContainer = document.getElementById('plantonista-options-container');
    if (plantonistaContainer) plantonistaContainer.classList.add('hidden');

    document.getElementById('plantao-day-fri').checked = false;
    document.getElementById('plantao-day-sat').checked = true;
    document.getElementById('plantao-day-sun').checked = false;
    document.getElementById('plantao-shift-select').value = '1';

    window.app?.openModal('modal-employee');
  }

  openEditModal(emp) {
    document.getElementById('employee-modal-title').textContent = `Editar ${emp.name}`;
    document.getElementById('employee-id').value = emp.id;
    document.getElementById('employee-name').value = emp.name;
    document.getElementById('employee-pref-shift').value = emp.prefShift || 'NONE';
    document.getElementById('employee-color').value = emp.color || '#10b981';
    document.getElementById('employee-color-preview').textContent = emp.color || '#10b981';
    document.getElementById('employee-status').value = emp.status || 'ACTIVE';

    const plantonistaContainer = document.getElementById('plantonista-options-container');
    if (emp.prefShift === 'PLANTONISTA') {
      plantonistaContainer?.classList.remove('hidden');
      const days = emp.onCallDays || ['SAT'];
      document.getElementById('plantao-day-fri').checked = days.includes('FRI');
      document.getElementById('plantao-day-sat').checked = days.includes('SAT');
      document.getElementById('plantao-day-sun').checked = days.includes('SUN');
      document.getElementById('plantao-shift-select').value = emp.onCallShift || '1';
    } else {
      plantonistaContainer?.classList.add('hidden');
    }

    window.app?.openModal('modal-employee');
  }

  saveEmployee() {
    const id = document.getElementById('employee-id').value;
    const name = document.getElementById('employee-name').value.trim();
    const prefShift = document.getElementById('employee-pref-shift').value;
    const color = document.getElementById('employee-color').value;
    const status = document.getElementById('employee-status').value;

    if (!name) {
      window.app?.showToast('Informe o nome do funcionário.', 'error');
      return;
    }

    const onCallDays = [];
    let onCallShift = '1';

    if (prefShift === 'PLANTONISTA') {
      if (document.getElementById('plantao-day-fri')?.checked) onCallDays.push('FRI');
      if (document.getElementById('plantao-day-sat')?.checked) onCallDays.push('SAT');
      if (document.getElementById('plantao-day-sun')?.checked) onCallDays.push('SUN');
      onCallShift = document.getElementById('plantao-shift-select')?.value || '1';
    }

    const employeeData = {
      id: id || null,
      name: name.toUpperCase(),
      prefShift: prefShift,
      onCallDays: onCallDays,
      onCallShift: onCallShift,
      color: color,
      status: status
    };

    this.store.saveEmployee(employeeData);
    window.app?.closeModal('modal-employee');
    this.render();

    if (window.calendarManager) {
      window.calendarManager.renderFilterOptions();
      window.calendarManager.render();
    }

    window.app?.showToast(`Colaborador ${employeeData.name} salvo!`, 'success');
  }

  deleteEmployee(id, name) {
    if (confirm(`Deseja inativar o colaborador ${name}? (Ele não será mais escalado automaticamente, mas o histórico de escalas passadas é mantido)`)) {
      this.store.deleteEmployee(id);
      this.render();
      if (window.calendarManager) {
        window.calendarManager.renderFilterOptions();
        window.calendarManager.render();
      }
      window.app?.showToast(`Colaborador ${name} inativado com sucesso.`, 'info');
    }
  }

  toggleEmployeeStatus(id, name) {
    this.store.toggleEmployeeStatus(id);
    this.render();
    if (window.calendarManager) {
      window.calendarManager.renderFilterOptions();
      window.calendarManager.render();
    }
    const emp = this.store.getEmployeeById(id);
    const statusText = emp?.status === 'ACTIVE' ? 'ativado' : 'inativado';
    window.app?.showToast(`Colaborador ${name} ${statusText}.`, 'info');
  }

  render() {
    const container = document.getElementById('employees-list-container');
    if (!container) return;

    const employees = this.store.getEmployees();
    container.innerHTML = '';

    const prefLabels = {
      'NONE': 'Giro / Rodízio entre turnos',
      'SHIFT_1': '1º Turno (Manhã)',
      'SHIFT_2': '2º Turno (Alternado)',
      'SHIFT_3': '3º Turno (Noite)',
      'NIGHT_WEEKDAY': 'Fixo Noite Seg-Qui / Manhã Sexta'
    };

    employees.forEach(emp => {
      const row = document.createElement('div');
      const isActive = (emp.status === 'ACTIVE');
      row.className = `employee-row-card ${isActive ? '' : 'is-inactive'}`;
      if (!isActive) row.style.opacity = '0.65';

      let shiftDescription = prefLabels[emp.prefShift] || 'Giro / Rodízio';
      if (emp.prefShift === 'PLANTONISTA') {
        const daysMap = { 'FRI': 'Sexta', 'SAT': 'Sábado', 'SUN': 'Domingo' };
        const daysStr = (emp.onCallDays || []).map(d => daysMap[d] || d).join(', ') || 'Fim de Semana';
        shiftDescription = `Plantonista (${daysStr})`;
      }

      row.innerHTML = `
        <div class="emp-row-left">
          <div class="emp-avatar-sm" style="background-color: ${emp.color || '#10b981'};">
            ${emp.name.charAt(0)}
          </div>
          <div class="emp-row-info">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <h4 style="margin: 0;">${emp.name}</h4>
              <span class="badge ${isActive ? 'badge-active' : 'badge-inactive'}" style="font-size: 0.65rem; padding: 1px 6px; border-radius: 4px; background: ${isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)'}; color: ${isActive ? '#10b981' : '#94a3b8'}; border: 1px solid ${isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.3)'};">
                ${isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <span>${shiftDescription}</span>
          </div>
        </div>

        <div class="emp-row-actions" style="display: flex; gap: 0.35rem; align-items: center;">
          <button class="btn btn-secondary-pill btn-toggle-status-emp" data-id="${emp.id}" title="${isActive ? 'Desativar' : 'Ativar'}" style="padding: 0.2rem 0.55rem; font-size: 0.72rem;">
            <i data-lucide="${isActive ? 'user-x' : 'user-check'}" style="width: 12px; height: 12px;"></i> ${isActive ? 'Desativar' : 'Ativar'}
          </button>
          <button class="btn btn-secondary-pill btn-edit-emp" data-id="${emp.id}" style="padding: 0.2rem 0.55rem; font-size: 0.72rem;">
            <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i> Editar
          </button>
          <button class="btn-icon-danger btn-delete-emp" data-id="${emp.id}" data-name="${emp.name}" title="Inativar Colaborador" style="width: 26px; height: 26px;">
            <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
          </button>
        </div>
      `;

      const editBtn = row.querySelector('.btn-edit-emp');
      editBtn?.addEventListener('click', () => this.openEditModal(emp));

      const toggleBtn = row.querySelector('.btn-toggle-status-emp');
      toggleBtn?.addEventListener('click', () => this.toggleEmployeeStatus(emp.id, emp.name));

      const delBtn = row.querySelector('.btn-delete-emp');
      delBtn?.addEventListener('click', () => this.deleteEmployee(emp.id, emp.name));

      container.appendChild(row);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}

const employeeManager = new EmployeeManager(window.store);
window.employeeManager = employeeManager;
