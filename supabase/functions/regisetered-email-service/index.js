import { Router } from 'express';
import { supabase } from '#supabase-client';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: RegisteredEmails
 *   description: Manage registered emails
 */

/**
 * @swagger
 * /v1/registered-emails/get-all-registered-emails:
 *   get:
 *     summary: Get all registered emails
 *     tags: [RegisteredEmails]
 *     responses:
 *       200:
 *         description: List of registered emails
 *       500:
 *         description: Server error
 */
router.get('/get-all-registered-emails', async (req, res) => {
  const { data, error } = await supabase.from('registered_emails').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * @swagger
 * /v1/registered-emails/get-registered-email/{id}:
 *   get:
 *     summary: Get a registered email by ID
 *     tags: [RegisteredEmails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Registered email ID
 *     responses:
 *       200:
 *         description: Registered email found
 *       404:
 *         description: Not found
 */
// Get one by id
router.get('/get-registered-email/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('registered_emails').select('*').eq('id', id).single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

/**
 * @swagger
 * /v1/registered-emails/register:
 *   post:
 *     summary: Register a new email (max 60 total)
 *     tags: [RegisteredEmails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Email registered
 *       400:
 *         description: Validation error or limit reached
 */
// Create one
router.post('/register', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Get current user count
  const { count, error: countError } = await supabase
    .from('registered_emails')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    return res.status(500).json({ error: countError.message });
  }

  if ((count || 0) + 1 > 60) {
    return res.status(400).json({ error: 'Total registered emails already reached its limit.' });
  }

  const { data, error } = await supabase.from('registered_emails').insert([{ email }]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @swagger
 * /v1/registered-emails/delete-email/{id}:
 *   delete:
 *     summary: Delete a registered email by ID
 *     tags: [RegisteredEmails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Email deleted
 *       400:
 *         description: Error deleting
 */
// Delete one by id
router.delete('/delete-email/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('registered_emails').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * @swagger
 * /v1/registered-emails/delete-emails:
 *   delete:
 *     summary: Delete multiple registered emails by IDs
 *     tags: [RegisteredEmails]
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
 *         description: Emails deleted
 *       400:
 *         description: Error deleting
 */
// Delete many by ids
router.delete('/delete-emails', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'Body must be { ids: [...] }' });
  const { data, error } = await supabase.from('registered_emails').delete().in('id', ids);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;