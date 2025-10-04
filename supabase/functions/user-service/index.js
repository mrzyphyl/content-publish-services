import { Router } from 'express';
import { supabase } from '#supabase-client';
import bcrypt from 'bcrypt';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Manage users
 */

/**
 * @swagger
 * /v1/users/get-all-users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *       500:
 *         description: Server error
 */
// Get all users
router.get('/get-all-users', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * @swagger
 * /v1/users/get-user/{id}:
 *   get:
 *     summary: Get a single user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
// Get one user by id
router.get('/get-user/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

/**
 * @swagger
 * /v1/users/create-user:
 *   post:
 *     summary: Create a new user (max 10 total)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error or user limit reached
 */
// Create one user (total users cannot exceed 10)
router.post('/create-user', async (req, res) => {
  const { password, ...rest } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Get current user count
  const { count, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    return res.status(500).json({ error: countError.message });
  }

  if ((count || 0) + 1 > 10) {
    return res.status(400).json({ error: 'Total users cannot exceed 10.' });
  }

  const { data, error } = await supabase.from('users').insert([{ ...rest, password: hashedPassword }]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @swagger
 * /v1/users/create-users:
 *   post:
 *     summary: Create multiple users (max 10 total)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 password:
 *                   type: string
 *     responses:
 *       201:
 *         description: Users created
 *       400:
 *         description: Validation error or user limit exceeded
 */
// Create many users (total users cannot exceed 10)
router.post('/create-users', async (req, res) => {
  const users = req.body; // expects an array of user objects
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: 'Request body must be an array of users.' });
  }

  // Hash passwords for each user
  const usersWithHashedPasswords = await Promise.all(
    users.map(async (user) => {
      if (!user.password) throw new Error('Password is required for all users.');
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const { password, ...rest } = user;
      return { ...rest, password: hashedPassword };
    })
  );

  // Get current user count
  const { count, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    return res.status(500).json({ error: countError.message });
  }

  if ((count || 0) + users.length > 10) {
    return res.status(400).json({ error: 'Total users cannot exceed 10.' });
  }

  const { data, error } = await supabase.from('users').insert(usersWithHashedPasswords).select();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @swagger
 * /v1/users/update-user:
 *   put:
 *     summary: Update a user (hash password if provided)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Error updating
 */
// Update one user (hash password if provided)
router.put('/update-user', async (req, res) => {
  const { id, ...updateData } = req.body;

  if (!id) return res.status(400).json({ error: 'User ID is required in the request body.' });

  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * @swagger
 * /v1/users/delete-user/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted
 *       400:
 *         description: Error deleting
 */
// Delete one user by id
router.delete('/delete-user/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('users').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * @swagger
 * /v1/users/delete-users:
 *   delete:
 *     summary: Delete multiple users by IDs
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *             example:
 *               ids: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Users deleted
 *       400:
 *         description: Error deleting
 */1
// Delete many users by ids
router.delete('/delete-users', async (req, res) => {
  const { ids } = req.body; // expects { ids: [id1, id2, ...] }
  const { data, error } = await supabase.from('users').delete().in('id', ids);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;

