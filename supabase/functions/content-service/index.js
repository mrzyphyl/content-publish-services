import { Router } from 'express';
import { supabase } from '#supabase-client';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: ContentPosts
 *   description: Manage content posts
 */

/**
 * @swagger
 * /v1/content-posts/get-all-contents:
 *   get:
 *     summary: Get all content posts
 *     tags: [ContentPosts]
 *     responses:
 *       200:
 *         description: List of content posts
 *       500:
 *         description: Server error
 */
router.get('/get-all-contents', async (req, res) => {
  const { data, error } = await supabase.from('content_posts').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * @swagger
 * /v1/content-posts/get-content/{id}:
 *   get:
 *     summary: Get a content post by ID
 *     tags: [ContentPosts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Content post ID
 *     responses:
 *       200:
 *         description: Content post found
 *       404:
 *         description: Content post not found
 */
// Get one by id
router.get('get-content/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('content_posts').select('*').eq('id', id).single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

/**
 * @swagger
 * /v1/content-posts/create-post:
 *   post:
 *     summary: Create a new content post (max 5 allowed)
 *     tags: [ContentPosts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Content post created
 *       400:
 *         description: Validation error or limit reached
 */
// Create one
router.post('/create-post', async (req, res) => {
  const newItem = req.body;

  // Get current user count
  const { count, error: countError } = await supabase
    .from('content_posts')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    return res.status(500).json({ error: countError.message });
  }

  if ((count || 0) + 1 > 5) {
    return res.status(400).json({ error: 'Total content posts already reached its limit.' });
  }
  
  const { data, error } = await supabase.from('content_posts').insert([newItem]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

/**
 * @swagger
 * /v1/content-posts/update-post:
 *   put:
 *     summary: Update a content post
 *     tags: [ContentPosts]
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
 *               description:
 *                 type: string
 *               content:
 *                 type: string
 *               updated_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Content post updated
 *       400:
 *         description: Error updating
 */
// Update by id from body
router.put('/update-post', async (req, res) => {
  const { id, ...updates } = req.body;

  if (!id) return res.status(400).json({ error: 'Content post ID is required in the request body.' });

  const { data, error } = await supabase.from('content_posts').update(updates).eq('id', id).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * @swagger
 * /v1/content-posts/delete-post/{id}:
 *   delete:
 *     summary: Delete a content post by ID
 *     tags: [ContentPosts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Content post deleted
 *       400:
 *         description: Error deleting
 */
// Delete by id
router.delete('/delete-post/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('content_posts').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/**
 * @swagger
 * /v1/content-posts/delete-posts:
 *   delete:
 *     summary: Delete multiple content posts by IDs
 *     tags: [ContentPosts]
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
 *         description: Content posts deleted
 *       400:
 *         description: Error deleting
 */
// Delete many by ids
router.delete('/delete-posts', async (req, res) => {
  const { ids } = req.body; // expects { ids: [id1, id2, ...] }

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Request body must include an array of ids.' });
  }

  const { data, error } = await supabase
    .from('content_posts')
    .delete()
    .in('id', ids);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;