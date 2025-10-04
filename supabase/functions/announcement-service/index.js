import { Router } from 'express';
import { supabase } from '#supabase-client';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Announcements
 *   description: Manage announcements
 */

/**
 * @swagger
 * /v1/announcements/get-all-announcements:
 *   get:
 *     summary: Get all announcements
 *     tags: [Announcements]
 *     responses:
 *       200:
 *         description: List of announcements (with expired flag if older than 15 days)
 *       500:
 *         description: Server error
 */
router.get('/get-all-announcements', async (req, res) => {
  const { data, error } = await supabase.from('announcements').select('*');
  if (error) return res.status(500).json({ error: error.message });

  const now = new Date();

  const processed = data.map(item => {
    const createdAt = new Date(item.created_at);
    const diffDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)); // 15 days in ms
    return {
      ...item,
      expired: diffDays > 15 ? 'true' : 'false' // string as requested
    };
  });

  res.json(processed);
});

/**
 * @swagger
 * /v1/announcements/get-announcement/{id}:
 *   get:
 *     summary: Get a single announcement by ID
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Announcement found
 *       404:
 *         description: Announcement not found
 */
// Get one announcement by id
router.get('/get-announcement/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

/**
 * @swagger
 * /v1/announcements/create-announcement:
 *   post:
 *     summary: Create a new announcement (max 5 total allowed)
 *     tags: [Announcements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content_post_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               creator_id:
 *                 type: integer
 *               creator_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Announcement created
 *       400:
 *         description: Validation error or limit reached
 */
// Create new announcement
router.post('/create-announcement', async (req, res) => {
  const newItem = req.body;

  // Get current user count
  const { count, error: countError } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    return res.status(500).json({ error: countError.message });
  }

  if ((count || 0) + 1 > 5) {
    return res.status(400).json({ error: 'Total announcements already reached its limit.' });
  }

  const { data, error } = await supabase
    .from('announcements')
    .insert([newItem])
    .select();
    
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @swagger
 * /v1/announcements/update-announcement:
 *   put:
 *     summary: Update an announcement
 *     tags: [Announcements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               updated_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Announcement updated
 *       400:
 *         description: Error updating
 */
// Update announcement by id from body
router.put('/update-announcement', async (req, res) => {
  const { id, ...updates } = req.body;

  if (!id) return res.status(400).json({ error: 'Announcement ID is required in the request body.' });

  const { data, error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * @swagger
 * /v1/announcements/delete-announcement/{id}:
 *   delete:
 *     summary: Delete an announcement by ID
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Announcement deleted
 *       400:
 *         description: Error deleting
 */
// Delete one announcement by id
router.delete('/delete-announcement/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * @swagger
 * /v1/announcements/delete-announcements:
 *   delete:
 *     summary: Delete multiple announcements
 *     tags: [Announcements]
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
 *         description: Announcements deleted
 *       400:
 *         description: Error deleting
 */
// Delete many announcements by ids
router.delete('/delete-announcements/', async (req, res) => {
  const { ids } = req.body; // expects { ids: [1, 2, 3] }
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Request body must include an array of ids.' });
  }

  const { data, error } = await supabase
    .from('announcements')
    .delete()
    .in('id', ids);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;