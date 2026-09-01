/**
 * APP.JS - Orquestrador Principal do Sistema de Escala
 */

class App {
  constructor() {
    this.store = window.store;
    this.scheduler = window.scheduler;
    window.app = this;
    this.init();
  }

  init() {
    this.bindNavigation();
    this.bindModals();
    this.bindAdminAuth();
    this.bindTopControls();

    // Inicializa os subgerenciadores
    window.calendarManager = new window.CalendarManager(this.store, this.scheduler);
    window.employeeManager = new window.EmployeeManager(this.store);
    window.exportManager = new window.ExportManager();

    this.updateAdminUI();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- BOTÕES DO TOPO (CONFIGURAÇÃO DE EQUIPE GERAL) ---
  bindTopControls() {
    // btn-month-team, btn-auto-generate e btn-clear-month são gerenciados por CalendarManager
    const btnTeam = document.getElementById('btn-manage-team');
    if (btnTeam) {
      btnTeam.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('more-actions-dropdown')?.classList.add('hidden');
        window.employeeManager?.render();
        this.openModal('modal-team-manager');
      });
    }
  }

  // --- NAVEGAÇÃO DE ABAS ---
  bindNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTabId = btn.dataset.tab;
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(section => {
          section.classList.remove('active');
        });

        const targetSection = document.getElementById(targetTabId);
        if (targetSection) {
          targetSection.classList.add('active');
        }

        if (window.lucide) {
          window.lucide.createIcons();
        }
      });
    });
  }

  // --- MODAIS ---
  bindModals() {
    document.querySelectorAll('.btn-close-modal, [data-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = btn.dataset.modal;
        if (modalId && (btn.classList.contains('btn-close-modal') || btn.classList.contains('btn-ghost'))) {
          this.closeModal(modalId);
        }
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          if (overlay.dataset.noBackdropClose === 'true' || overlay.id === 'modal-campaigns') {
            return;
          }
          this.closeModal(overlay.id);
        }
      });
    });

    document.querySelectorAll('.modal-overlay form').forEach(form => {
      form.addEventListener('input', () => { form.dataset.isDirty = 'true'; });
      form.addEventListener('change', () => { form.dataset.isDirty = 'true'; });
      form.addEventListener('submit', () => { form.dataset.isDirty = 'false'; });
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      const form = modal.querySelector('form');
      if (form) form.dataset.isDirty = 'false';
      modal.classList.remove('hidden');
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return true;

    const dirtyForm = modal.querySelector('form[data-is-dirty="true"]');
    if (dirtyForm) {
      const confirmClose = confirm('Você tem alterações não salvas. Deseja realmente fechar?');
      if (!confirmClose) {
        return false;
      }
      dirtyForm.dataset.isDirty = 'false';
    }

    modal.classList.add('hidden');
    return true;
  }

  // --- AUTENTICAÇÃO ADMINISTRADOR ---
  bindAdminAuth() {
    const btnToggleAdmin = document.getElementById('btn-toggle-admin');
    const formLogin = document.getElementById('form-admin-login');

    if (btnToggleAdmin) {
      btnToggleAdmin.addEventListener('click', () => {
        if (this.store.isAdmin()) {
          this.store.logoutAdmin();
          this.updateAdminUI();
          this.showToast('Saiu do Modo Admin.', 'info');
        } else {
          const pinInput = document.getElementById('admin-pin');
          if (pinInput) pinInput.value = '';
          const errBox = document.getElementById('admin-login-error');
          if (errBox) errBox.classList.add('hidden');
          this.openModal('modal-admin-login');
        }
      });
    }

    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const pinInput = document.getElementById('admin-pin');
        const pin = pinInput ? pinInput.value : '';
        if (this.store.loginAdmin(pin)) {
          this.closeModal('modal-admin-login');
          this.updateAdminUI();
          this.showToast('Modo Admin liberado!', 'success');
        } else {
          const errBox = document.getElementById('admin-login-error');
          if (errBox) errBox.classList.remove('hidden');
        }
      });
    }
  }

  updateAdminUI() {
    const isAdmin = this.store.isAdmin();
    const btnText = document.getElementById('admin-btn-text');
    const roleBadge = document.getElementById('admin-badge');
    const roleText = document.getElementById('role-text');

    if (isAdmin) {
      document.body.classList.add('is-admin');
      if (btnText) btnText.textContent = 'Sair do Admin';
      if (roleBadge) roleBadge.className = 'badge-role admin-mode';
      if (roleText) roleText.textContent = 'Admin Ativo';
    } else {
      document.body.classList.remove('is-admin');
      if (btnText) btnText.textContent = 'Admin';
      if (roleBadge) roleBadge.className = 'badge-role employee-mode';
      if (roleText) roleText.textContent = 'Visualização';
    }

    if (window.calendarManager) {
      window.calendarManager.render();
    }
    if (window.employeeManager) {
      window.employeeManager.render();
    }
  }

  // --- NOTIFICAÇÕES TOAST ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-circle';

    toast.innerHTML = `
      <i data-lucide="${iconName}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    if (window.lucide) {
      window.lucide.createIcons();
    }

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

// Inicializa a Aplicação
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
