import { Auth } from '../_lib/auth';
import { AppsScriptProvider } from '../_lib/appsScriptProvider';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  // CORS Protection is handled via vercel.json
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ success: false, message: 'Email and senha are required' });
    }

    // 1. Hash the password before sending to Google Sheets
    const hashedPassword = await Auth.hashPassword(senha);

    // 2. Call Apps Script to save the user with the HASHED password
    const backendResponse = await AppsScriptProvider.registerUser(email, hashedPassword);

    if (!backendResponse || !backendResponse.success) {
      return res.status(400).json(backendResponse);
    }

    // 3. Generate secure JWT for the newly registered user
    const token = Auth.generateToken({ email: email, security_id: backendResponse.security_id });

    // 4. Set HttpOnly Cookie
    res.setHeader('Set-Cookie', serialize('na_quadra_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    }));

    // Do NOT send the raw security_id or password back to the client
    return res.status(200).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      user: { email: email, ...backendResponse.dados } // Assuming Apps Script returns user data in 'dados'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
