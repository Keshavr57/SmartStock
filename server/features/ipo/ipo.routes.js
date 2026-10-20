import express from 'express';
import { getIpoBoard } from './ipo.service.js';

const router = express.Router();

// GET /api/ipo            -> open, upcoming and last-30-day closed IPOs from NSE
// GET /api/ipo?refresh=1  -> bypass the 10-minute cache
router.get('/', async (req, res) => {
    try {
        const board = await getIpoBoard({ forceRefresh: req.query.refresh === '1' });
        res.json({ status: 'success', data: board });
    } catch (error) {
        res.status(503).json({ status: 'error', message: 'IPO data is temporarily unavailable from NSE. Please try again shortly.' });
    }
});

// Backward-compatible alias for older clients.
router.get('/upcoming', (req, res) => res.redirect(307, `${req.baseUrl}/${req.query.refresh ? '?refresh=1' : ''}`));

export default router;
