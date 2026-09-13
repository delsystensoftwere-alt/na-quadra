/**
 * Frontend Na Quadra
 * Lógica de interface, controle de navegação, Dashboard do atleta e eventos.
 */

let toastTimer = null;

/* -----------------------------
   Navegação
------------------------------ */

function showScreen(screen) {
  const appShell = document.querySelector('.app-shell');
  const bottomNav = document.getElementById('bottom-nav');

  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('screen-' + screen);
  if (target) target.classList.add('active');

  // Ajusta o layout dependendo se é Dashboard ou Auth
  if (screen === 'dashboard') {
    if (appShell) appShell.classList.add('dashboard-mode');
    if (bottomNav) bottomNav.classList.add('active');
    
    // Atualiza dados do atleta caso haja sessão salva
    const session = getStoredSession();
    if (session && session.email) {
      updateAthleteProfile(session.email);
    }
  } else {
    if (appShell) appShell.classList.remove('dashboard-mode');
    if (bottomNav) bottomNav.classList.remove('active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  const heroTitle = document.getElementById('hero-title');
  const heroSubtitle = document.getElementById('hero-subtitle');
  const heroTexts = {
    login: ['Bem-vindo de volta às quadras!', 'Acesse sua conta para continuar jogando.'],
    signup: ['Junte-se à comunidade!', 'Crie sua conta e comece a jogar.'],
    reset: ['Esqueceu a senha?', 'Vamos te ajudar a voltar pra quadra.']
  };

  if (heroTexts[screen] && heroTitle && heroSubtitle) {
    heroTitle.textContent = heroTexts[screen][0];
    heroSubtitle.textContent = heroTexts[screen][1];
  }
}

/* -----------------------------
   Utilidades
------------------------------ */

function value(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message || 'Ocorreu um erro.';
  toast.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = 'toast';
  }, 4200);
}

function setLoading(buttonId, loading, loadingText) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  if (loading) {
    button.dataset.originalHtml = button.innerHTML;
    button.innerHTML = '<span class="spinner"></span><span>' + (loadingText || 'Aguarde...') + '</span>';
    button.disabled = true;
  } else {
    button.innerHTML = button.dataset.originalHtml || button.innerHTML;
    button.disabled = false;
  }
}

function responseMessage(response, fallback) {
  return response?.message || response?.mensagem || response?.error || response?.erro || fallback;
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

/* -----------------------------
   Sessão (Lembrar de mim)
------------------------------ */

function saveSession(sessionData) {
  const remember = document.getElementById('remember-me')?.checked;
  const payload = JSON.stringify({
    email: sessionData.email,
    unique_id: sessionData.unique_id,
    security_id: sessionData.security_id
  });

  try {
    if (remember) {
      localStorage.setItem('naQuadraSession', payload);
      sessionStorage.removeItem('naQuadraSession');
    } else {
      sessionStorage.setItem('naQuadraSession', payload);
      localStorage.removeItem('naQuadraSession');
    }
  } catch (e) {
    console.warn('Não foi possível salvar sessão no Storage:', e);
  }
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

function updateAthleteProfile(email) {
  if (!email) return;

  const nameEl = document.getElementById('athlete-name');
  const initialsEl = document.getElementById('athlete-initials');

  // Extrai nome antes do @ do e-mail
  const username = email.split('@')[0];
  const formattedName = username.charAt(0).toUpperCase() + username.slice(1);

  if (nameEl) nameEl.textContent = formattedName;
  if (initialsEl) initialsEl.textContent = formattedName.slice(0, 2).toUpperCase();
}

/* -----------------------------
   LOGIN
------------------------------ */

async function login() {
  const email = value('login-email');
  const senha = value('login-password');

  if (!email || !senha) {
    showToast('Informe seu email e sua senha.', 'error');
    return;
  }

  setLoading('login-button', true, 'Entrando na Quadra...');

  try {
    const response = await apiLogin(email, senha);
    setLoading('login-button', false);

    if (!response.success) {
      showToast(responseMessage(response, 'Email ou senha inválidos.'), 'error');
      return;
    }

    const sessionData = {
      ...response,
      email: response.email || email
    };

    saveSession(sessionData);
    updateAthleteProfile(sessionData.email);
    showToast('Bem-vindo de volta à quadra!', 'success');

    // Transição suave para o Dashboard
    setTimeout(() => {
      showScreen('dashboard');
    }, 400);

  } catch (error) {
    setLoading('login-button', false);
    showToast('Erro ao executar o login: ' + (error?.message || error), 'error');
  }
}

/* -----------------------------
   LOGOUT
------------------------------ */

function logout() {
  clearStoredSession();
  showToast('Você saiu da sua conta. Até o próximo jogo!', 'success');
  showScreen('login');
}

/* -----------------------------
   CADASTRO
------------------------------ */

async function registerUser() {
  const email = value('signup-email');
  const senha = value('signup-password');
  const confirmacao = value('signup-password-confirm');

  if (!email || !senha || !confirmacao) {
    showToast('Preencha todos os campos.', 'error');
    return;
  }
  if (senha.length < 6) {
    showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
    return;
  }
  if (senha !== confirmacao) {
    showToast('As senhas não são iguais.', 'error');
    return;
  }

  setLoading('signup-button', true, 'Criando...');

  try {
    const response = await apiRegister(email, senha);
    setLoading('signup-button', false);

    if (!response.success) {
      showToast(responseMessage(response, 'Não foi possível criar a conta.'), 'error');
      return;
    }

    showToast('Conta criada com sucesso!', 'success');

    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';
    document.getElementById('signup-password-confirm').value = '';

    setTimeout(() => showScreen('login'), 700);
  } catch (error) {
    setLoading('signup-button', false);
    showToast('Erro ao criar a conta: ' + (error?.message || error), 'error');
  }
}

/* -----------------------------
   RESET - Solicitar Link
------------------------------ */

async function requestReset() {
  const email = value('reset-email');

  if (!email) {
    showToast('Informe o email da sua conta.', 'error');
    return;
  }

  setLoading('reset-request-button', true, 'Enviando...');

  try {
    const response = await apiRequestReset(email);
    setLoading('reset-request-button', false);

    showToast(
      responseMessage(response, 'Se o e-mail existir, enviamos as instruções.'),
      response.success ? 'success' : 'error'
    );

    if (response.success) {
      goToResetStepPassword();
    }
  } catch (error) {
    setLoading('reset-request-button', false);
    showToast('Erro ao solicitar recuperação: ' + (error?.message || error), 'error');
  }
}

function goToResetStepPassword() {
  document.getElementById('reset-step-email').classList.add('hidden');
  document.getElementById('reset-step-password').classList.remove('hidden');
  document.getElementById('reset-description').textContent =
    'Clique no link que enviamos por e-mail, ou cole o código dele abaixo.';
}

/* -----------------------------
   RESET - Salvar Nova Senha
------------------------------ */

async function resetPassword() {
  const resetId = value('reset-code');
  const senha = value('reset-password');
  const confirmacao = value('reset-password-confirm');

  if (!resetId) {
    showToast('Cole o código recebido no e-mail.', 'error');
    return;
  }
  if (!senha || !confirmacao) {
    showToast('Preencha todos os campos.', 'error');
    return;
  }
  if (senha.length < 6) {
    showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
    return;
  }
  if (senha !== confirmacao) {
    showToast('As senhas não são iguais.', 'error');
    return;
  }

  setLoading('reset-password-button', true, 'Salvando...');

  try {
    const response = await apiResetPassword(resetId, senha);
    setLoading('reset-password-button', false);

    if (!response.success) {
      showToast(responseMessage(response, 'Não foi possível redefinir a senha.'), 'error');
      return;
    }

    showToast('Senha alterada com sucesso!', 'success');
    resetResetForm();
    setTimeout(() => showScreen('login'), 900);
  } catch (error) {
    setLoading('reset-password-button', false);
    showToast('Erro ao redefinir senha: ' + (error?.message || error), 'error');
  }
}

function resetResetForm() {
  document.getElementById('reset-email').value = '';
  document.getElementById('reset-code').value = '';
  document.getElementById('reset-password').value = '';
  document.getElementById('reset-password-confirm').value = '';
  document.getElementById('reset-step-email').classList.remove('hidden');
  document.getElementById('reset-step-password').classList.add('hidden');
  document.getElementById('reset-description').textContent =
    'Informe seu e-mail cadastrado. Vamos te enviar um link para redefinir sua senha com segurança.';
}

/* -----------------------------
   INTERAÇÕES DO DASHBOARD
------------------------------ */

let isCheckedIn = true;

function toggleCheckin() {
  const btn = document.getElementById('btn-checkin');
  if (!btn) return;

  isCheckedIn = !isCheckedIn;

  if (isCheckedIn) {
    btn.innerHTML = '<span class="material-symbols-outlined">how_to_reg</span><span>Check-in Feito</span>';
    btn.style.background = 'var(--primary-container)';
    showToast('Presença confirmada no Rachão Noturno! 🏀', 'success');
  } else {
    btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span><span>Confirmar Presença</span>';
    btn.style.background = 'var(--surface-high)';
    showToast('Check-in cancelado.');
  }
}

function joinMatch(btn) {
  const isJoined = btn.classList.contains('joined');
  const card = btn.closest('.match-item');
  const spotsEl = card ? card.querySelector('.match-spots') : null;

  if (!isJoined) {
    btn.classList.add('joined');
    btn.innerHTML = '<span>Confirmado</span><span class="material-symbols-outlined" style="font-size: 14px;">check</span>';
    if (spotsEl) {
      spotsEl.textContent = 'Presença confirmada!';
      spotsEl.style.color = '#10b981';
    }
    showToast('Você entrou no rachão! Te vemos na quadra! 🏀', 'success');
  } else {
    btn.classList.remove('joined');
    btn.innerHTML = '<span>Entrar na Partida</span><span class="material-symbols-outlined" style="font-size: 14px;">sports_basketball</span>';
    if (spotsEl) {
      spotsEl.textContent = 'Faltam vagas';
      spotsEl.style.color = '#10b981';
    }
    showToast('Você saiu desta partida.');
  }
}

function setFilter(chip, category) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');

  const matches = document.querySelectorAll('.match-item');
  matches.forEach(match => {
    if (category === 'all') {
      match.style.display = 'flex';
    } else if (category === '3x3' || category === '5x5') {
      match.style.display = (match.dataset.category === category) ? 'flex' : 'none';
    } else {
      match.style.display = 'flex';
    }
  });
}

function setNavActive(btn, tab) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  btn.classList.add('active');

  if (tab === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    const titles = {
      matches: 'Partidas e Rachões',
      courts: 'Quadras na Região',
      ranking: 'Ranking da Temporada',
      profile: 'Perfil do Atleta'
    };
    showToast('Aba "' + (titles[tab] || tab) + '" será conectada em breve!', 'success');
  }
}

/* Atalho para desenvolvimento/demo */
function enterDemoDashboard() {
  updateAthleteProfile('atleta.campeao@naquadra.com');
  showScreen('dashboard');
  showToast('Modo Demonstração do Dashboard ativado! 🏀', 'success');
}

/* -----------------------------
   INICIALIZAÇÃO DA PÁGINA
------------------------------ */

document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);
  const incomingResetId = urlParams.get('reset_id') || urlParams.get('resetId');

  if (incomingResetId) {
    showScreen('reset');
    goToResetStepPassword();
    const resetCodeInput = document.getElementById('reset-code');
    if (resetCodeInput) {
      resetCodeInput.value = incomingResetId;
    }
    return;
  }

  // Verifica se o usuário já possui sessão ativa
  const session = getStoredSession();
  if (session && session.email) {
    updateAthleteProfile(session.email);
    showScreen('dashboard');
  } else {
    showScreen('login');
  }
});

/* -----------------------------
   Teclado: ENTER para enviar
------------------------------ */

document.addEventListener('keydown', function (event) {
  if (event.key !== 'Enter') return;
  const activeScreen = document.querySelector('.screen.active');
  if (!activeScreen) return;

  if (activeScreen.id === 'screen-login') login();
  else if (activeScreen.id === 'screen-signup') registerUser();
});
