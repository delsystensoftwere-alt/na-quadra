/**
 * Vercel Serverless Function - Proxy para o Backend Google Apps Script
 *
 * Resolve problemas de CORS e redirects 302 do Apps Script,
 * mantendo a comunicação limpa e segura entre o Front-end e o Google Sheets.
 */

const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbxXojAkfUcX5xn05fEpJmGrxlqdctuQZGcW4umGhQ3u259osyH_oxw7sqvj-foEknoa/exec';

export default async function handler(req, res) {
  // Configuração de CORS para permitir requisições do frontend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Tratamento de preflight request do navegador
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido. Use POST.' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (parseError) {
      data = {
        success: false,
        message: 'O servidor backend retornou uma resposta em formato inválido.',
        raw: text
      };
    }

    return res.status(response.status || 200).json(data);
  } catch (error) {
    console.error('Erro no proxy auth:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao conectar com o serviço de dados.',
      error: error.message
    });
  }
}
