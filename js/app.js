/**
 * Frontend Na Quadra - Gestão de Usuários e Atletas
 * Telas focadas:
 * 1. Complete seu Cadastro (Aba USERS)
 * 2. Cadastro de Atleta (Aba ATLETAS)
 */

let toastTimer = null;

/* =============================================================
   1. NAVEGAÇÃO ENTRE SUBGRUPOS (TELA ÚNICA)
============================================================= */

const VIEW_TITLES = {
  'subview-complete-profile': 'Complete seu Cadastro (Aba USERS)',
  'subview-register-athlete': 'Cadastro de Atleta Ativo (Aba ATLETAS)'
};

function navigateTo(subviewId, buttonElement) {
  // 1. Oculta todos os subgrupos
  document.querySelectorAll('.subview-group').forEach(view => view.classList.remove('active'));

  // 2. Ativa o subgrupo selecionado
  const targetView = document.getElementById(subviewId);
  if (targetView) targetView.classList.add('active');

  // 3. Atualiza botão ativo na sidebar
  document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active'));
  if (buttonElement) {
    buttonElement.classList.add('active');
  } else {
    const btn = document.querySelector(`[onclick*="${subviewId}"]`);
    if (btn) btn.classList.add('active');
  }

  // 4. Atualiza título da topbar
  const pageTitle = document.getElementById('page-title');
  if (pageTitle && VIEW_TITLES[subviewId]) {
    pageTitle.textContent = VIEW_TITLES[subviewId];
  }

  // 5. Se for para a tela de atleta, verifica se a etapa 1 foi concluída
  if (subviewId === 'subview-register-athlete') {
    checkAthleteUnlockStatus();
  }

  // 6. Fecha sidebar no mobile
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchMainGroup(groupId) {
  document.querySelectorAll('.view-group').forEach(group => group.classList.remove('active'));
  const target = document.getElementById(groupId);
  if (target) target.classList.add('active');
}

function showAuthScreen(screenId) {
  document.querySelectorAll('.auth-screen').forEach(scr => scr.classList.remove('active'));
  const target = document.getElementById('auth-' + screenId);
  if (target) target.classList.add('active');
}

function toggleSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

/* =============================================================
   2. ETAPA 1: COMPLETE SEU CADASTRO (ABA "USERS")
============================================================= */

function handleUserPhotoSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('A imagem deve ter no máximo 5MB.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result;
    document.getElementById('user-image-base64').value = base64;
    
    // Atualiza preview
    const previewImg = document.getElementById('user-image-preview');
    const fallback = document.getElementById('user-image-fallback');
    previewImg.src = base64;
    previewImg.classList.remove('hidden');
    fallback.classList.add('hidden');

    showToast('Foto selecionada com sucesso!', 'success');
  };
  reader.readAsDataURL(file);
}

function handleUserUrlInput(url) {
  const previewImg = document.getElementById('user-image-preview');
  const fallback = document.getElementById('user-image-fallback');

  if (url && url.startsWith('http')) {
    previewImg.src = url;
    previewImg.classList.remove('hidden');
    fallback.classList.add('hidden');
  } else {
    previewImg.classList.add('hidden');
    fallback.classList.remove('hidden');
  }
}

function calcUserAge(dobString) {
  if (!dobString) return;
  const dob = new Date(dobString);
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  return isNaN(age) ? '' : age;
}

async function saveUserProfile() {
  const nome = value('user-name');
  const conta = document.getElementById('user-conta')?.value || 'Atleta';
  const dob = value('user-dob');
  const telefone = value('user-phone');
  const endereco = value('user-address');
  const numero = value('user-number');
  const bairro = value('user-bairro');
  const cidade = value('user-city');
  const uf = document.getElementById('user-uf')?.value || 'SP';
  const urlImagem = value('user-image-url');
  const imagemBase64 = value('user-image-base64');

  if (!nome) {
    showToast('Por favor, preencha o seu Nome Completo.', 'error');
    return;
  }

  const session = getStoredSession() || {};
  const uniqueId = session.unique_id || 'DEMO_USER_' + Date.now();
  const securityId = session.security_id || '';

  const userData = {
    Nome: nome,
    conta: conta,
    data_de_Nascimento: dob,
    Telefone: telefone,
    Endereço: endereco,
    Numero: numero,
    Bairro: bairro,
    Cidade: cidade,
    UF: uf,
    Ativo: 'TRUE',
    Url_Imagem: urlImagem,
    Imagem: imagemBase64 || urlImagem
  };

  const btn = document.getElementById('btn-save-user-profile');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Salvando no servidor...</span>';
  }

  try {
    // Se houver sessão real conectada, envia para a API na aba USERS
    if (session.security_id) {
      const response = await apiUpdateUser(uniqueId, userData, securityId);
      if (!response.success) {
        showToast(response.message || 'Erro ao atualizar dados.', 'error');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span class="material-symbols-outlined">save</span><span>Salvar e Concluir Cadastro</span>';
        }
        return;
      }
    }

    // Salva localmente o estado de perfil completo
    const updatedSession = {
      ...session,
      unique_id: uniqueId,
      profileCompleted: true,
      userData: userData
    };
    saveSession(updatedSession);

    // Atualiza badges visuais
    markStep1Completed(userData);

    showToast('Cadastro de usuário concluído com sucesso! Etapa 1 pronta.', 'success');

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined">check</span><span>Cadastro Concluído!</span>';
    }

    // Pré-preenche os dados na Etapa 2 (Atleta)
    populateAthleteFromUser(userData);

    // Redireciona para a Etapa 2 após 600ms
    setTimeout(() => {
      navigateTo('subview-register-athlete');
    }, 600);

  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined">save</span><span>Salvar e Concluir Cadastro</span>';
    }
    showToast('Erro ao salvar dados. Verifique a conexão.', 'error');
  }
}

function markStep1Completed(userData) {
  // Atualiza badge no menu
  const b1 = document.getElementById('badge-step1-status');
  if (b1) {
    b1.textContent = 'Concluído';
    b1.className = 'nav-status-badge success';
  }

  // Atualiza banner de topo
  const banner = document.getElementById('profile-status-banner');
  if (banner) {
    banner.className = 'notice-banner success';
    banner.innerHTML = `
      <div class="notice-icon"><span class="material-symbols-outlined">verified</span></div>
      <div class="notice-content">
        <h3>Cadastro de Usuário Completo!</h3>
        <p>Seus dados básicos foram salvos com sucesso na aba USERS. A Etapa 2 (Cadastro de Atleta) está liberada!</p>
      </div>
    `;
  }

  // Atualiza badge de bloqueio da etapa 2
  const b2 = document.getElementById('badge-step2-status');
  if (b2) {
    b2.textContent = 'Liberado';
    b2.className = 'nav-status-badge warn';
  }

  // Atualiza avatar do operador na sidebar
  if (userData.Nome) {
    document.getElementById('dash-user-name').textContent = userData.Nome;
    const imgEl = document.getElementById('dash-user-avatar-img');
    const textEl = document.getElementById('dash-user-avatar-text');
    if (userData.Imagem && imgEl) {
      imgEl.src = userData.Imagem;
      imgEl.style.display = 'block';
      if (textEl) textEl.style.display = 'none';
    }
  }
}

/* =============================================================
   3. ETAPA 2: CADASTRO DE ATLETA (ABA "ATLETAS")
============================================================= */

function checkAthleteUnlockStatus() {
  const session = getStoredSession();
  const isCompleted = session && session.profileCompleted;

  const lockCard = document.getElementById('athlete-lock-card');
  const formContainer = document.getElementById('athlete-form-container');

  if (!isCompleted) {
    if (lockCard) lockCard.classList.remove('hidden');
    if (formContainer) formContainer.classList.add('hidden');
  } else {
    if (lockCard) lockCard.classList.add('hidden');
    if (formContainer) formContainer.classList.remove('hidden');
    
    // Se houver dados do usuário, pré-preenche
    if (session.userData) {
      populateAthleteFromUser(session.userData);
    }
  }
}

function populateAthleteFromUser(u) {
  const nameInput = document.getElementById('ath-name-input');
  const dobInput = document.getElementById('ath-dob-input');
  const phoneInput = document.getElementById('ath-phone-input');

  if (nameInput && !nameInput.value) nameInput.value = u.Nome || '';
  if (dobInput && !dobInput.value) {
    dobInput.value = u.data_de_Nascimento || '';
    handleAthleteDobChange(u.data_de_Nascimento);
  }
  if (phoneInput && !phoneInput.value) phoneInput.value = u.Telefone || '';

  syncAthletePreview();
}

function handleAthletePhotoSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result;
    document.getElementById('athlete-image-base64').value = base64;
    
    // Atualiza preview no form e no trading card
    updateAthleteCardPhoto(base64);
  };
  reader.readAsDataURL(file);
}

function handleAthleteUrlInput(url) {
  updateAthleteCardPhoto(url);
}

function copyPhotoFromUser() {
  const userPhoto = value('user-image-base64') || value('user-image-url');
  if (!userPhoto) {
    showToast('Você ainda não escolheu uma foto de perfil na Etapa 1.', 'error');
    return;
  }
  updateAthleteCardPhoto(userPhoto);
  document.getElementById('athlete-image-url').value = userPhoto.startsWith('http') ? userPhoto : '';
  document.getElementById('athlete-image-base64').value = userPhoto;
  showToast('Foto copiada do perfil de usuário!', 'success');
}

function updateAthleteCardPhoto(photoSrc) {
  const previewImg = document.getElementById('athlete-image-preview');
  const fallback = document.getElementById('athlete-image-fallback');
  const cardImg = document.getElementById('card-preview-img');
  const cardFallback = document.getElementById('card-preview-fallback');

  if (photoSrc) {
    if (previewImg) { previewImg.src = photoSrc; previewImg.classList.remove('hidden'); }
    if (fallback) fallback.classList.add('hidden');
    if (cardImg) { cardImg.src = photoSrc; cardImg.classList.remove('hidden'); }
    if (cardFallback) cardFallback.classList.add('hidden');
  } else {
    if (previewImg) previewImg.classList.add('hidden');
    if (fallback) fallback.classList.remove('hidden');
    if (cardImg) cardImg.classList.add('hidden');
    if (cardFallback) cardFallback.classList.remove('hidden');
  }
}

function handleAthleteDobChange(dobString) {
  const age = calcUserAge(dobString);
  const ageDisplay = document.getElementById('ath-age-display');
  if (ageDisplay) ageDisplay.value = age ? `${age} anos` : '';

  const cardAge = document.getElementById('card-preview-age');
  if (cardAge) cardAge.textContent = age ? `${age}a` : '--';
}

function syncAthletePreview() {
  const name = value('ath-name-input') || 'Nome do Atleta';
  const pos = document.getElementById('ath-position-input')?.value || 'Armador (PG)';
  const height = value('ath-height-input') || '--';
  const weight = value('ath-weight-input') || '--';

  const cardName = document.getElementById('card-preview-name');
  const cardPos = document.getElementById('card-preview-pos');
  const cardH = document.getElementById('card-preview-height');
  const cardW = document.getElementById('card-preview-weight');

  if (cardName) cardName.textContent = name;
  if (cardPos) cardPos.textContent = pos;
  if (cardH) cardH.textContent = height;
  if (cardW) cardW.textContent = weight;
}

function formatBirthdayColumn(dobString) {
  if (!dobString) return '';
  const parts = dobString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`; // DD/MM
  }
  return '';
}

async function saveAthleteProfile() {
  const session = getStoredSession() || {};
  const userId = session.unique_id;

  if (!userId) {
    showToast('Usuário não identificado. Complete a Etapa 1 primeiro.', 'error');
    navigateTo('subview-complete-profile');
    return;
  }

  const nome = value('ath-name-input');
  const pos = document.getElementById('ath-position-input')?.value || 'Armador';
  const altura = value('ath-height-input');
  const peso = value('ath-weight-input');
  const genero = document.getElementById('ath-gender-input')?.value || 'Masculino';
  const dob = value('ath-dob-input');
  const telefone = value('ath-phone-input');
  const urlImagem = value('athlete-image-url');
  const imagemBase64 = value('athlete-image-base64');
  const idade = calcUserAge(dob);
  const aniversario = formatBirthdayColumn(dob);

  if (!nome) {
    showToast('Informe o nome do atleta.', 'error');
    return;
  }

  const athleteData = {
    unique_id: 'ATH_' + Date.now(),
    user_id: userId,
    nome: nome,
    data_de_nascimento: dob,
    telefone: telefone,
    'posição de jogo': pos,
    altura: altura,
    peso: peso,
    genero: genero,
    url_image: urlImagem,
    Imagem: imagemBase64 || urlImagem,
    coluna_aniversario: aniversario,
    idade: idade
  };

  const btn = document.getElementById('btn-save-athlete');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Salvando atleta na plataforma...</span>';
  }

  try {
    // Se houver sessão real conectada, envia para a API na aba ATLETAS
    if (session.security_id) {
      const response = await apiCreateAthlete(athleteData, session.security_id);
      if (!response.success) {
        showToast(response.message || 'Erro ao registrar atleta.', 'error');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span class="material-symbols-outlined">sports_basketball</span><span>Salvar Cadastro de Atleta</span>';
        }
        return;
      }
    }

    // Salva localmente
    const updatedSession = {
      ...session,
      athleteRegistered: true,
      athleteData: athleteData
    };
    saveSession(updatedSession);

    // Atualiza status na sidebar
    const b2 = document.getElementById('badge-step2-status');
    if (b2) {
      b2.textContent = 'Ativo';
      b2.className = 'nav-status-badge success';
    }

    showToast('Parabéns! Você agora é um Atleta Ativo na Quadra! 🏀', 'success');

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined">verified</span><span>Atleta Ativo!</span>';
    }

  } catch (error) {
    console.error('Erro ao salvar atleta:', error);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined">sports_basketball</span><span>Salvar Cadastro de Atleta</span>';
    }
    showToast('Erro de conexão ao salvar atleta.', 'error');
  }
}

/* =============================================================
   4. UTILITÁRIOS, LOGIN E SESSÃO
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
      btn.innerHTML = '<span>Entrar na Plataforma</span><span class="material-symbols-outlined">arrow_forward</span>';
    }

    if (!response.success) {
      showToast(response.message || 'Credenciais inválidas.', 'error');
      return;
    }

    saveSession({ email, ...response });
    updateOperatorHeader(email);
    showToast('Login realizado com sucesso!', 'success');
    
    switchMainGroup('group-dashboard');
    navigateTo('subview-complete-profile');

  } catch (error) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>Entrar na Plataforma</span><span class="material-symbols-outlined">arrow_forward</span>';
    }
    showToast('Erro ao conectar ao servidor.', 'error');
  }
}

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
    showToast('As senhas não coincidem.', 'error');
    return;
  }

  const btn = document.getElementById('signup-button');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Criando conta...</span>';
  }

  try {
    const response = await apiRegister(email, senha);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>Criar Conta</span><span class="material-symbols-outlined">sports_basketball</span>';
    }

    if (!response.success) {
      showToast(response.message || 'Não foi possível criar a conta.', 'error');
      return;
    }

    showToast('Conta criada com sucesso! Faça seu login para completar o cadastro.', 'success');
    document.getElementById('login-email').value = email;
    showAuthScreen('login');

  } catch (error) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>Criar Conta</span><span class="material-symbols-outlined">sports_basketball</span>';
    }
    showToast('Erro ao criar conta.', 'error');
  }
}

function logout() {
  clearStoredSession();
  showToast('Sessão encerrada com segurança.');
  switchMainGroup('group-auth');
  showAuthScreen('login');
}

function enterDirectDashboard() {
  const demoEmail = 'atleta.demo@naquadra.com';
  saveSession({ email: demoEmail, unique_id: 'DEMO_ATLETA_01', profileCompleted: false });
  updateOperatorHeader(demoEmail);
  switchMainGroup('group-dashboard');
  navigateTo('subview-complete-profile');
  showToast('Acesso de demonstração ativado! Complete seu cadastro.', 'success');
}

function updateOperatorHeader(email) {
  const nameEl = document.getElementById('dash-user-name');
  const emailEl = document.getElementById('dash-user-email');
  const avatarText = document.getElementById('dash-user-avatar-text');
  
  if (email) {
    const name = email.split('@')[0];
    const cleanName = name.charAt(0).toUpperCase() + name.slice(1);
    if (nameEl) nameEl.textContent = cleanName;
    if (emailEl) emailEl.textContent = email;
    if (avatarText) avatarText.textContent = cleanName.slice(0, 2).toUpperCase();
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

  const session = getStoredSession();
  if (session && session.email) {
    updateOperatorHeader(session.email);
    if (session.userData) {
      markStep1Completed(session.userData);
    }
    switchMainGroup('group-dashboard');
    navigateTo('subview-complete-profile');
  } else {
    // Por padrão abre no grupo de autenticação / login
    switchMainGroup('group-auth');
    showAuthScreen('login');
  }
});
