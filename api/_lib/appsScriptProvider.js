// Abstração do Banco de Dados (hoje: Apps Script, amanhã: Firebase)

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxXojAkfUcX5xn05fEpJmGrxlqdctuQZGcW4umGhQ3u259osyH_oxw7sqvj-foEknoa/exec';

export const AppsScriptProvider = {
  /**
   * Envia a requisição POST para o Apps Script
   */
  async _fetch(payload) {
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });
      
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (err) {
        return { success: false, message: 'Invalid JSON from Apps Script', raw: text };
      }
    } catch (error) {
      return { success: false, message: 'Connection Error', error: error.message };
    }
  },

  async registerUser(email, hashed_password) {
    return this._fetch({
      acao: 'register',
      aba: 'USERS',
      email: email,
      senha: hashed_password // Passamos a hash pro Apps Script, não a senha real
    });
  },

  async loginUser(email, hashed_password) {
    return this._fetch({
      acao: 'login',
      aba: 'USERS',
      email: email,
      senha: hashed_password // O Apps Script vai comparar Hash com Hash (como strings opacas)
    });
  },
  
  async updateUser(uniqueId, userData, securityId) {
    return this._fetch({
      acao: 'update',
      aba: 'USERS',
      unique_id: uniqueId,
      security_id: securityId,
      dados: userData
    });
  },
  
  async createAthlete(athleteData, securityId) {
    return this._fetch({
      acao: 'create',
      aba: 'ATLETAS',
      security_id: securityId,
      ...athleteData
    });
  }
};
