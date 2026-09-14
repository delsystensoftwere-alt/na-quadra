/**
 * Frontend Na Quadra - Sistema de Gestão de Torneios e Jogos
 * Arquitetura de Tela Única baseada em Grupos de Visibilidade (visivel=true/false).
 */

let toastTimer = null;
let timerInterval = null;
let isTimerRunning = false;
let matchSeconds = 4 * 60 + 32; // 04:32 inicial

/* =============================================================
   1. NAVEGAÇÃO ENTRE SUBGRUPOS (TELA ÚNICA - 1ms DE RESPOSTA)
============================================================= */

const VIEW_TITLES = {
  'subview-matches': 'Mesa de Partidas',
  'subview-athletes': 'Atletas / Cadastro',
  'subview-teams': 'Equipes & Times',
  'subview-courts': 'Quadras & Estrutura',
  'subview-settings': 'Regras do Torneio'
};

/**
 * Alterna entre subgrupos de conteúdo no Dashboard.
 * Todos os outros recebem visivel=false, apenas o target recebe visivel=true.
 */
function navigateTo(subviewId, buttonElement) {
  // 1. Oculta todos os subgrupos
  const allSubviews = document.querySelectorAll('.subview-group');
  allSubviews.forEach(view => view.classList.remove('active'));

  // 2. Torna visível apenas o subgrupo selecionado
  const targetView = document.getElementById(subviewId);
  if (targetView) {
    targetView.classList.add('active');
  }

  // 3. Atualiza o botão ativo na Sidebar
  document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active'));
  if (buttonElement) {
    buttonElement.classList.add('active');
  } else {
    const defaultBtn = document.querySelector(`[onclick*="${subviewId}"]`);
    if (defaultBtn) defaultBtn.classList.add('active');
  }

  // 4. Atualiza o título da Topbar
  const pageTitle = document.getElementById('page-title');
  if (pageTitle && VIEW_TITLES[subviewId]) {
    pageTitle.textContent = VIEW_TITLES[subviewId];
  }

  // 5. Fecha a sidebar no mobile se estiver aberta
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
  }
}

/**
 * Alterna entre os dois grandes blocos: Autenticação vs Dashboard.
 */
function switchMainGroup(groupId) {
  document.querySelectorAll('.view-group').forEach(group => group.classList.remove('active'));
  const target = document.getElementById(groupId);
  if (target) target.classList.add('active');
}

/**
 * Alterna as telas internas de autenticação (Login, Cadastro, Reset).
 */
function showAuthScreen(screenId) {
  document.querySelectorAll('.auth-screen').forEach(scr => scr.classList.remove('active'));
  const target = document.getElementById('auth-' + screenId);
  if (target) target.classList.add('active');

  const titles = {
    login: ['Acesso ao Sistema', 'Mesa de organização e atletas'],
    signup: ['Criar Conta', 'Cadastre seu perfil ou equipe'],
    reset: ['Recuperar Senha', 'Redefina seu acesso']
  };

  const titleEl = document.getElementById('auth-title');
  const subEl = document.getElementById('auth-subtitle');
  if (titles[screenId] && titleEl && subEl) {
    titleEl.textContent = titles[screenId][0];
    subEl.textContent = titles[screenId][1];
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

/* =============================================================
   2. CONTROLES DA MESA DE PARTIDAS (PLACAR E CRONÔMETRO)
============================================================= */

function addPoints(teamNum, pts) {
  const scoreEl = document.getElementById('team' + teamNum + '-score');
  if (!scoreEl) return;

  let current = parseInt(scoreEl.textContent, 10) || 0;
  current = Math.max(0, current + pts);
  scoreEl.textContent = current;

  // Feedback visual de ponto
  scoreEl.style.transform = 'scale(1.15)';
  setTimeout(() => { scoreEl.style.transform = 'scale(1)'; }, 150);
}

function toggleTimer() {
  const timerEl = document.getElementById('match-timer');
  if (!timerEl) return;

  isTimerRunning = !isTimerRunning;

  if (isTimerRunning) {
    timerInterval = setInterval(() => {
      if (matchSeconds > 0) {
        matchSeconds--;
        const min = String(Math.floor(matchSeconds / 60)).padStart(2, '0');
        const sec = String(matchSeconds % 60).padStart(2, '0');
        timerEl.textContent = `${min}:${sec}`;
      } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        showToast('Fim de tempo de jogo! 🚨', 'error');
      }
    }, 1000);
    showToast('Cronômetro em andamento');
  } else {
    clearInterval(timerInterval);
    showToast('Cronômetro pausado');
  }
}

/* =============================================================
   3. CADASTRO & GESTÃO DE ATLETAS (INSTANTÂNEO)
============================================================= */

function saveAthlete() {
  const name = value('ath-name');
  const nickname = value('ath-nickname');
  const number = value('ath-number') || '00';
  const position = document.getElementById('ath-position')?.value || 'Armador';
  const team = document.getElementById('ath-team')?.value || 'Sem Equipe';

  if (!name) {
    showToast('Por favor, informe ao menos o nome do atleta.', 'error');
    return;
  }

  const tbody = document.getElementById('athletes-table-body');
  if (!tbody) return;

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><span class="number-chip">${String(number).padStart(2, '0')}</span></td>
    <td><strong>${escapeHtml(name)}</strong> <span style="color:var(--secondary);">${nickname ? '(' + escapeHtml(nickname) + ')' : ''}</span></td>
    <td>${escapeHtml(position)}</td>
    <td>${escapeHtml(team)}</td>
    <td><span style="color:var(--success); font-weight:700;">● Regular</span></td>
    <td><button class="link-inline" style="font-size:12px; color:var(--error);" onclick="removeAthlete(this)">Remover</button></td>
  `;

  tbody.prepend(tr);

  // Limpa campos
  document.getElementById('ath-name').value = '';
  document.getElementById('ath-nickname').value = '';
  document.getElementById('ath-number').value = '';

  updateAthletesCount();
  showToast(`Atleta ${name} cadastrado com sucesso! 🏀`, 'success');
}

function removeAthlete(btn) {
  const row = btn.closest('tr');
  if (row) {
    row.remove();
    updateAthletesCount();
    showToast('Atleta removido da listagem.');
  }
}

function filterAthletes(term) {
  const filter = (term || '').toLowerCase();
  const rows = document.querySelectorAll('#athletes-table-body tr');

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(filter) ? '' : 'none';
  });
}

function updateAthletesCount() {
  const countEl = document.getElementById('athletes-count');
  const rows = document.querySelectorAll('#athletes-table-body tr');
  if (countEl) countEl.textContent = rows.length;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
  });
}

/* =============================================================
   4. UTILITÁRIOS, SESSÃO E LOGIN
============================================================= */

function value(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message || 'Aviso';
  toast.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3800);
}

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const icon = button.querySelector('.material-symbols-outlined');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.textContent = 'visibility';
  } else {
    input.type = 'password';
    if (icon) icon.textContent = 'visibility_off';
  }
}

function saveSession(sessionData) {
  const remember = document.getElementById('remember-me')?.checked;
  const payload = JSON.stringify(sessionData);
  try {
    if (remember) {
      localStorage.setItem('naQuadraSession', payload);
      sessionStorage.removeItem('naQuadraSession');
    } else {
      sessionStorage.setItem('naQuadraSession', payload);
      localStorage.removeItem('naQuadraSession');
    }
  } catch (e) {}
}

function getStoredSession() {
  try {
    const raw = localStorage.getItem('naQuadraSession') || sessionStorage.getItem('naQuadraSession');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function clearStoredSession() {
  try {
    localStorage.removeItem('naQuadraSession');
    sessionStorage.removeItem('naQuadraSession');
  } catch (e) {}
}

async function login() {
  const email = value('login-email');
  const senha = value('login-password');

  if (!email || !senha) {
    showToast('Informe seu e-mail e senha.', 'error');
    return;
  }

  const btn = document.getElementById('login-button');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Verificando...</span>';
  }

  try {
    const response = await apiLogin(email, senha);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>Entrar na Quadra</span><span class="material-symbols-outlined">bolt</span>';
    }

    if (!response.success) {
      showToast(response.message || 'Credenciais inválidas.', 'error');
      return;
    }

    saveSession({ email, ...response });
    updateOperatorHeader(email);
    showToast('Login efetuado com sucesso!', 'success');
    switchMainGroup('group-dashboard');

  } catch (error) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>Entrar na Quadra</span><span class="material-symbols-outlined">bolt</span>';
    }
    showToast('Erro ao conectar ao servidor.', 'error');
  }
}

function logout() {
  clearStoredSession();
  showToast('Sessão encerrada com segurança.');
  switchMainGroup('group-auth');
  showAuthScreen('login');
}

function enterDirectDashboard() {
  updateOperatorHeader('mesa.torneio@naquadra.com');
  switchMainGroup('group-dashboard');
  navigateTo('subview-matches');
  showToast('Mesa de operação do torneio aberta! 🏀', 'success');
}

function updateOperatorHeader(email) {
  const nameEl = document.getElementById('dash-user-name');
  const avatarEl = document.getElementById('dash-user-avatar');
  if (email) {
    const name = email.split('@')[0];
    const cleanName = name.charAt(0).toUpperCase() + name.slice(1);
    if (nameEl) nameEl.textContent = cleanName;
    if (avatarEl) avatarEl.textContent = cleanName.slice(0, 2).toUpperCase();
  }
}

function updateClock() {
  const clockEl = document.getElementById('current-clock');
  if (clockEl) {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${h}:${m}`;
  }
}

/* =============================================================
   5. INICIALIZAÇÃO
============================================================= */

document.addEventListener('DOMContentLoaded', function () {
  updateClock();
  setInterval(updateClock, 30000);

  // Verifica URL com reset de senha
  const urlParams = new URLSearchParams(window.location.search);
  const resetId = urlParams.get('reset_id') || urlParams.get('resetId');
  if (resetId) {
    switchMainGroup('group-auth');
    showAuthScreen('reset');
    const stepEmail = document.getElementById('reset-step-email');
    const stepPass = document.getElementById('reset-step-password');
    const codeInput = document.getElementById('reset-code');
    if (stepEmail) stepEmail.classList.add('hidden');
    if (stepPass) stepPass.classList.remove('hidden');
    if (codeInput) codeInput.value = resetId;
    return;
  }

  // Verifica se há sessão gravada
  const session = getStoredSession();
  if (session && session.email) {
    updateOperatorHeader(session.email);
    switchMainGroup('group-dashboard');
    navigateTo('subview-matches');
  } else {
    // Por padrão na mesa do torneio, entra direto no Dashboard pronto para operação
    switchMainGroup('group-dashboard');
    navigateTo('subview-matches');
  }
});
