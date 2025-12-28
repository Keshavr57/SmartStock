import express from 'express';
import { listLessons, fetchLesson, getLearningPath, searchLessons } from '../controllers/learningController.js';

const router = express.Router();

// GET /api/learning/list - Get all lessons with optional filtering
router.get('/list', listLessons);

// GET /api/learning/lesson/:id - Get specific lesson content
router.get('/lesson/:id', fetchLesson);

// GET /api/learning/path - Get learning path for user level
router.get('/path', getLearningPath);

// GET /api/learning/search - Search lessons
router.get('/search', searchLessons);

export default router;