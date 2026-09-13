/**
 * Camada de integração com o Backend
 * Suporta tanto o ambiente Vercel (via Serverless Function /api/auth)
 * quanto fallback direto para o Webhook do Google Apps Script.
 */

const API_CONFIG = {
  // Rota na Vercel (recomendada para produção para contornar CORS)
  VERCEL_PROXY_URL: '/api/auth',

  // URL direta do Apps Script (usada como fallback em ambiente local se necessário)
  APPS_SCRIPT_DIRECT_URL: 'https://script.google.com/macros/s/AKfycbxXojAkfUcX5xn05fEpJmGrxlqdctuQZGcW4umGhQ3u259osyH_oxw7sqvj-foEknoa/exec',

  USERS_SHEET: 'USERS',

  ACTIONS: {
    LOGIN: 'login',
    REGISTER: 'register',
    REQUEST_RESET: 'request_reset',
    RESET_PASSWORD: 'reset_password',
    VALIDAR_TOKEN: 'validar_token',
    LOGOUT: 'logout'
  }
};

/**
 * Executa a chamada HTTP para o backend.
 */
async function callBackend(action, params = {}) {
  if (!action) {
    return { success: false, message: 'Ação não informada.' };
  }

  const payload = Object.assign({ acao: action }, params);

  // Determina se usamos a rota da Vercel ou o endpoint direto
  const isVercelHost = window.location.protocol.startsWith('http') && window.location.hostname !== 'localhost';
  const targetUrl = isVercelHost ? API_CONFIG.VERCEL_PROXY_URL : (window.location.origin.includes('vercel.app') ? API_CONFIG.VERCEL_PROXY_URL : API_CONFIG.APPS_SCRIPT_DIRECT_URL);

  try {
    // Tenta primeiro o endpoint da Vercel
    let response;
    let usedUrl = API_CONFIG.VERCEL_PROXY_URL;

    try {
      response = await fetch(API_CONFIG.VERCEL_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // Se a rota da Vercel responder 404 (ex: abrindo localmente via static server sem a Vercel CLI), faz fallback
      if (response.status === 404) {
        throw new Error('Proxy Vercel não encontrado, usando conexão direta.');
      }
    } catch (proxyError) {
      // Fallback para requisição direta ao Apps Script
      usedUrl = API_CONFIG.APPS_SCRIPT_DIRECT_URL;
      response = await fetch(API_CONFIG.APPS_SCRIPT_DIRECT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // text/plain evita preflight OPTIONS no Apps Script
        },
        body: JSON.stringify(payload)
      });
    }

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      return {
        success: false,
        message: 'O servidor não retornou um formato JSON válido.',
        raw: text
      };
    }

    // Normaliza status de sucesso
    const isSuccess = data.success === true || data.sucesso === true || data.status === 'success';
    return { ...data, success: isSuccess };

  } catch (error) {
    console.error('Erro na requisição para:', action, error);
    return {
      success: false,
      message: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
      detail: String(error)
    };
  }
}

/* -------------------------------------------------------------
   Funções de Autenticação
------------------------------------------------------------- */

async function apiLogin(email, senha) {
  return await callBackend(API_CONFIG.ACTIONS.LOGIN, {
    aba: API_CONFIG.USERS_SHEET,
    email: email,
    senha: senha
  });
}

async function apiRegister(email, senha) {
  return await callBackend(API_CONFIG.ACTIONS.REGISTER, {
    aba: API_CONFIG.USERS_SHEET,
    email: email,
    senha: senha
  });
}

async function apiRequestReset(email) {
  // No navegador moderno, linkBase é a URL atual da aplicação
  const linkBase = window.location.origin + window.location.pathname;

  return await callBackend(API_CONFIG.ACTIONS.REQUEST_RESET, {
    aba: API_CONFIG.USERS_SHEET,
    email: email,
    link_base: linkBase
  });
}

async function apiResetPassword(resetId, novaSenha) {
  return await callBackend(API_CONFIG.ACTIONS.RESET_PASSWORD, {
    reset_id: resetId,
    nova_senha: novaSenha
  });
}

async function apiValidarToken(securityId) {
  return await callBackend(API_CONFIG.ACTIONS.VALIDAR_TOKEN, {
    security_id: securityId
  });
}

async function apiLogout(securityId) {
  return await callBackend(API_CONFIG.ACTIONS.LOGOUT, {
    security_id: securityId
  });
}
