const express = require('express');
const db = require('../config/database');

/**
 * Public content routes factory (FR-4)
 * Digunakan untuk education_articles, news, agendas
 */
function contentRoutes(tableName) {
  const router = express.Router();

  /**
   * GET /api/{education|news|agendas}
   * Daftar konten publik (status = terbit)
   */
  router.get('/', async (req, res) => {
    try {
      const { page = 1, limit = 12, category_id } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let where = "status = 'terbit'";
      const params = [];

      if (category_id) {
        where += ' AND category_id = ?';
        params.push(category_id);
      }

      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM ${tableName} WHERE ${where}`,
        params
      );

      let orderField = 'created_at';
      if (tableName === 'agendas') orderField = 'tanggal';
      if (tableName === 'news') orderField = 'tanggal';

      const [items] = await db.query(
        `SELECT t.*, c.nama as kategori
         FROM ${tableName} t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE ${where}
         ORDER BY t.${orderField} DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      res.json({
        data: items,
        pagination: {
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error(`Content list error (${tableName}):`, error);
      res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
  });

  /**
   * GET /api/{education|news|agendas}/:slug
   * Detail konten publik
   */
  router.get('/:slug', async (req, res) => {
    try {
      const [items] = await db.query(
        `SELECT t.*, c.nama as kategori, u.nama as author
         FROM ${tableName} t
         LEFT JOIN categories c ON t.category_id = c.id
         LEFT JOIN users u ON t.author_id = u.id
         WHERE t.slug = ? AND t.status = 'terbit'`,
        [req.params.slug]
      );

      if (items.length === 0) {
        return res.status(404).json({ error: 'Konten tidak ditemukan.' });
      }

      res.json(items[0]);
    } catch (error) {
      console.error(`Content detail error (${tableName}):`, error);
      res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
  });

  return router;
}

module.exports = contentRoutes;
