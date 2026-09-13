/**
 * DB_LBB_CLOUND - Frontend
 * Frontend Apps Script separado do backend.
 *
 * Fluxo:
 * Navegador -> google.script.run -> este projeto -> DB_LBB_CLOUND -> Sheets/Drive
 */

const CONFIG = {
  APP_NAME: 'Na Quadra',

  // Backend DB_LBB_CLOUND
  // Não guardamos mais o ID da planilha aqui — o backend já sabe qual é a
  // sua, via Propriedades do Script (ALLOWED_SHEET_ID). Isso evita que o
  // ID fique visível em qualquer HTML/JS público.
  BACKEND_URL: 'https://script.google.com/macros/s/AKfycbxXojAkfUcX5xn05fEpJmGrxlqdctuQZGcW4umGhQ3u259osyH_oxw7sqvj-foEknoa/exec',

  // Aba utilizada pelas quatro operações de autenticação
  USERS_SHEET: 'USERS',

  ACTIONS: {
    LOGIN: 'login',
    REGISTER: 'register',
    REQUEST_RESET: 'request_reset',
    RESET_PASSWORD: 'reset_password'
  }
};

function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');

  // Se o link do e-mail de reset foi aberto (.../exec?reset_id=xxxx), repassa
  // o valor pro HTML pra já abrir direto na tela de nova senha, preenchida.
  template.resetId = (e && e.parameter && e.parameter.reset_id) ? e.parameter.reset_id : '';

  return template
    .evaluate()
    .setTitle(CONFIG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Faz uma chamada POST (JSON) ao backend.
 * sheet_id é acrescentado automaticamente em TODAS as chamadas.
 */
function callBackend(action, params) {
  if (!action) {
    return { success: false, message: 'Ação não informada.' };
  }

  params = params || {};

  var finalParams = Object.assign({ acao: action }, params);

  try {
    var response = UrlFetchApp.fetch(CONFIG.BACKEND_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(finalParams),
      muteHttpExceptions: true
    });

    var status = response.getResponseCode();
    var text = response.getContentText();
    var data;

    try {
      data = JSON.parse(text);
    } catch (parseError) {
      data = { success: false, message: 'O backend retornou uma resposta que não é JSON.', raw: text };
    }

    if (typeof data !== 'object' || data === null) {
      data = { success: false, message: 'Resposta inválida do backend.', raw: text };
    }

    data.httpStatus = status;
    return data;

  } catch (error) {
    return { success: false, message: 'Não foi possível conectar ao servidor.', detail: String(error) };
  }
}

/**
 * LOGIN
 */
function apiLogin(email, senha) {
  return callBackend(CONFIG.ACTIONS.LOGIN, {
    aba: CONFIG.USERS_SHEET,
    email: email,
    senha: senha
  });
}

/**
 * CADASTRO (só email/senha)
 */
function apiRegister(email, senha) {
  return callBackend(CONFIG.ACTIONS.REGISTER, {
    aba: CONFIG.USERS_SHEET,
    email: email,
    senha: senha
  });
}

/**
 * SOLICITAÇÃO DE RESET
 * link_base = URL publicada deste próprio frontend, pra o e-mail apontar
 * de volta pra cá (e não pro backend).
 */
function apiRequestReset(email) {
  const linkBase = ScriptApp.getService().getUrl();

  return callBackend(CONFIG.ACTIONS.REQUEST_RESET, {
    aba: CONFIG.USERS_SHEET,
    email: email,
    link_base: linkBase
  });
}

/**
 * RESET DE SENHA
 */
function apiResetPassword(resetId, novaSenha) {
  return callBackend(CONFIG.ACTIONS.RESET_PASSWORD, {
    reset_id: resetId,
    nova_senha: novaSenha
  });
}

/**
 * Ações autenticadas (exigem security_id) — exemplos prontos para uso
 * quando o dashboard for construído.
 */
function apiValidarToken(securityId) {
  return callBackend('validar_token', { security_id: securityId });
}

function apiLogout(securityId) {
  return callBackend('logout', { security_id: securityId });
}
