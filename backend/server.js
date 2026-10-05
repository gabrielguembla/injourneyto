

import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import connection from './src/config/db.js';


const app = express();
const PORT = process.env.PORT || 3000;

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
  throw new Error(
    'GOOGLE_CLIENT_ID and JWT_SECRET must be configured.'
  );
}

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use(express.json());

function createAppToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
}

async function verifyGoogleCredential(credential) {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();

  if (
    !payload ||
    !payload.sub ||
    !payload.email ||
    payload.email_verified !== true
  ) {
    throw new Error('Google account verification failed.');
  }

  return payload;
}

function sendLoginResponse(res, user) {
  const token = createAppToken(user);

  res.json({
    message: 'Login successful.',
    token,
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      photo_url: user.photo_url
    }
  });
}

app.get('/', (req, res) => {
  res.json({ message: 'InJourneyTo API is running.' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const [rows] = await connection.execute(
      'SELECT 1 AS database_connected'
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Database test failed:', error);

    res.status(500).json({
      message: 'Could not connect to the database.'
    });
  }
});

// Step 1: Verify Google's ID token.
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: 'Google credential is required.'
      });
    }

    const googleUser = await verifyGoogleCredential(credential);

    // Find an account already linked to this Google ID.
    const [googleAccounts] = await connection.execute(
      `SELECT id, first_name, last_name, email, role, photo_url
       FROM \`user\`
       WHERE google_id = ?`,
      [googleUser.sub]
    );

    if (googleAccounts.length > 0) {
      return sendLoginResponse(res, googleAccounts[0]);
    }

    // Do not automatically link a local account by email.
    const [emailAccounts] = await connection.execute(
      `SELECT id, auth_provider
       FROM \`user\`
       WHERE email = ?`,
      [googleUser.email]
    );

    if (emailAccounts.length > 0) {
      return res.status(409).json({
        code: 'ACCOUNT_EXISTS',
        message:
          'An account with this email already exists. Sign in with your existing method before linking Google.'
      });
    }

    // A new user must complete the required address fields.
    return res.json({
      status: 'profile_required',
      googleProfile: {
        email: googleUser.email,
        name: googleUser.name || '',
        picture: googleUser.picture || ''
      }
    });
  } catch (error) {
    console.error('Google authentication failed:', error.message);

    return res.status(401).json({
      message: 'Google authentication failed.'
    });
  }
});

// Step 2: Create the account after the address form is completed.
app.post('/api/auth/google/complete', async (req, res) => {
  try {
    const { credential, address } = req.body;

    if (!credential || !address) {
      return res.status(400).json({
        message: 'Google credential and address are required.'
      });
    }

    const googleUser = await verifyGoogleCredential(credential);

    const requiredFields = [
      'first_name',
      'last_name',
      'cep',
      'numero',
      'bairro',
      'cidade',
      'estado',
      'logradouro'
    ];

    for (const field of requiredFields) {
      if (
        typeof address[field] !== 'string' ||
        !address[field].trim()
      ) {
        return res.status(400).json({
          message: `The field ${field} is required.`
        });
      }
    }

    if (!/^\d{5}-?\d{3}$/.test(address.cep)) {
      return res.status(400).json({
        message: 'Enter a valid Brazilian CEP.'
      });
    }

    if (!/^[A-Za-z]{2}$/.test(address.estado)) {
      return res.status(400).json({
        message: 'Enter a valid two-letter state abbreviation.'
      });
    }

    // Check again to avoid creating a duplicate account.
    const [existingGoogle] = await connection.execute(
      `SELECT id, first_name, last_name, email, role, photo_url
       FROM \`user\`
       WHERE google_id = ?`,
      [googleUser.sub]
    );

    if (existingGoogle.length > 0) {
      return sendLoginResponse(res, existingGoogle[0]);
    }

    const [existingEmail] = await connection.execute(
      `SELECT id FROM \`user\` WHERE email = ?`,
      [googleUser.email]
    );

    if (existingEmail.length > 0) {
      return res.status(409).json({
        message:
          'An account with this email already exists. Sign in with your existing method.'
      });
    }

    const googleName = (googleUser.name || '').trim().split(/\s+/);
    const firstName = address.first_name.trim();
    const lastName = address.last_name.trim();

    if (!firstName || !lastName) {
      return res.status(400).json({
        message: 'First and last name are required.'
      });
    }

    const [result] = await connection.execute(
      `INSERT INTO \`user\`
       (
         first_name,
         last_name,
         cep,
         numero,
         complemento,
         bairro,
         cidade,
         estado,
         ponto_referencia,
         logradouro,
         email,
         password,
         role,
         auth_provider,
         google_id,
         photo_url
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'user', 'google', ?, ?)`,
      [
        firstName,
        lastName,
        address.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2'),
        address.numero.trim(),
        address.complemento?.trim() || null,
        address.bairro.trim(),
        address.cidade.trim(),
        address.estado.trim().toUpperCase(),
        address.ponto_referencia?.trim() || null,
        address.logradouro.trim(),
        googleUser.email,
        googleUser.sub,
        googleUser.picture || null
      ]
    );

    const newUser = {
      id: result.insertId,
      first_name: firstName,
      last_name: lastName,
      email: googleUser.email,
      role: 'user',
      photo_url: googleUser.picture || null
    };

    return sendLoginResponse(res, newUser);
  } catch (error) {
    console.error('Google account creation failed:', error.message);

    return res.status(500).json({
      message: 'Could not complete Google account registration.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}/`);
});