import { Router } from 'express';
import { supabase } from '#supabase-client';
import bcrypt from 'bcrypt';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /v1/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userData:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     middle_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     suffix:
 *                       type: string
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid email or password
 */

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Fetch user by email
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Compare password using bcrypt
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const userData = { 
        id: user.id,
        email: user.email, 
        first_name: user.first_name, 
        middle_name: user.middle_name, 
        last_name: user.last_name, 
        suffix: user.suffix
    };

  res.json({ message: 'Login successful', userData });
});

export default router;