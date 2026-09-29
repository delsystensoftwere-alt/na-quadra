const { Auth } = require('../_lib/auth');
const { AppsScriptProvider } = require('../_lib/appsScriptProvider');
const { serialize } = require('cookie');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios' });
    }

    // Hash the plain text password to compare it with the stored hash
    const hashedPassword = await Auth.hashPassword(senha);
    
    // Call Apps Script login function passing the HASH. 
    // Since Apps Script does a string comparison, if the hashes match, it returns success.
    const backendResponse = await AppsScriptProvider.loginUser(email, hashedPassword);

    if (!backendResponse || !backendResponse.success) {
      // Simulate failed login - we don't want to expose if email exists or password is wrong
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    // Generate JWT
    const token = Auth.generateToken({ 
      email: email, 
      security_id: backendResponse.security_id, // Store internal ID in token, not on client
      unique_id: backendResponse.dados?.unique_id // Keep track of the user ID
    });

    // Set HttpOnly Cookie
    res.setHeader('Set-Cookie', serialize('na_quadra_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    }));

    // Return success without exposing sensitive data
    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      user: backendResponse.dados // Send user data to UI (name, photo, etc)
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
