import comprehensiveLearningService from '../services/comprehensiveLearningService.js';

export const listLessons = async (req, res) => {
    try {
        const { difficulty, category } = req.query;
        
        let lessons;
        if (difficulty) {
            lessons = comprehensiveLearningService.getLessonsByDifficulty(difficulty);
        } else if (category) {
            lessons = comprehensiveLearningService.getLessonsByCategory(category);
        } else {
            lessons = comprehensiveLearningService.getAllLessons();
        }
        
        res.json({ 
            status: "success", 
            data: lessons,
            stats: comprehensiveLearningService.getLearningStats(),
            categories: comprehensiveLearningService.getCategories(),
            difficultyLevels: comprehensiveLearningService.getDifficultyLevels()
        });
    } catch (error) {
        console.error('Learning list error:', error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

export const fetchLesson = async (req, res) => {
    try {
        console.log(`📚 Fetching lesson: ${req.params.id}`);
        const content = await comprehensiveLearningService.getLessonContent(req.params.id);
        res.json({ status: "success", data: content });
    } catch (error) {
        console.error('Lesson fetch error:', error);
        res.status(404).json({ status: "error", message: error.message });
    }
};

export const getLearningPath = async (req, res) => {
    try {
        const { level = 'beginner' } = req.query;
        const path = comprehensiveLearningService.getLearningPath(level);
        res.json({ status: "success", data: path });
    } catch (error) {
        console.error('Learning path error:', error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

export const searchLessons = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ status: "error", message: "Search query is required" });
        }
        
        const results = comprehensiveLearningService.searchLessons(q);
        res.json({ 
            status: "success", 
            query: q,
            count: results.length,
            data: results 
        });
    } catch (error) {
        console.error('Learning search error:', error);
        res.status(500).json({ status: "error", message: error.message });
    }
};