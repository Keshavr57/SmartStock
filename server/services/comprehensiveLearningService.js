import axios from 'axios';
import { COMPREHENSIVE_LESSONS, LEARNING_CATEGORIES, DIFFICULTY_LEVELS } from '../data/comprehensiveLessons.js';

class ComprehensiveLearningService {
    constructor() {
        this.aiServiceUrl = process.env.AI_SERVICE_URL || 'https://smartstock-ai-service.onrender.com';
        this.fallbackContent = this.generateFallbackContent();
    }

    // Get all lessons organized by difficulty
    getAllLessons() {
        return {
            beginner: COMPREHENSIVE_LESSONS.beginner,
            intermediate: COMPREHENSIVE_LESSONS.intermediate,
            advanced: COMPREHENSIVE_LESSONS.advanced,
            expert: COMPREHENSIVE_LESSONS.expert
        };
    }

    // Get lessons by difficulty level
    getLessonsByDifficulty(difficulty) {
        return COMPREHENSIVE_LESSONS[difficulty] || [];
    }

    // Get lessons by category
    getLessonsByCategory(category) {
        const allLessons = [
            ...COMPREHENSIVE_LESSONS.beginner,
            ...COMPREHENSIVE_LESSONS.intermediate,
            ...COMPREHENSIVE_LESSONS.advanced,
            ...COMPREHENSIVE_LESSONS.expert
        ];
        
        return allLessons.filter(lesson => 
            lesson.category.toLowerCase().includes(category.toLowerCase())
        );
    }

    // Get learning path for a user based on their level
    getLearningPath(userLevel = 'beginner') {
        const paths = {
            beginner: [
                'what-are-stocks',
                'stock-exchanges', 
                'types-of-stocks',
                'how-to-buy-stocks',
                'reading-stock-prices'
            ],
            intermediate: [
                'fundamental-analysis',
                'technical-analysis-intro',
                'portfolio-diversification',
                'dividend-investing',
                'market-orders-types'
            ],
            advanced: [
                'options-basics',
                'futures-trading',
                'sector-analysis',
                'risk-management',
                'ipo-analysis'
            ],
            expert: [
                'algorithmic-trading',
                'global-markets',
                'alternative-investments',
                'tax-optimization'
            ]
        };

        return paths[userLevel] || paths.beginner;
    }

    // Get detailed lesson content with AI enhancement
    async getLessonContent(lessonId) {
        const lesson = this.findLessonById(lessonId);
        if (!lesson) {
            throw new Error("Lesson not found");
        }

        try {
            // Try to get AI-enhanced content
            const response = await axios.post(`${this.aiServiceUrl}/process`, {
                message: `${lesson.prompt} 

                Structure your response as follows:
                1. Brief introduction (2-3 sentences)
                2. Main concepts with examples
                3. Practical tips for Indian investors
                4. Common mistakes to avoid
                
                Keep it engaging and under 300 words. Use bullet points where appropriate.`,
                user_id: "comprehensive_learning"
            }, { timeout: 8000 });

            return {
                id: lesson.id,
                title: lesson.title,
                difficulty: lesson.difficulty,
                duration: lesson.duration,
                category: lesson.category,
                description: lesson.description,
                content: response.data.answer,
                keyPoints: lesson.keyPoints,
                isAiGenerated: true,
                nextLessons: this.getNextLessons(lessonId),
                relatedLessons: this.getRelatedLessons(lessonId)
            };

        } catch (error) {
            console.warn(`⚠️ AI Service unavailable for lesson ${lessonId}. Using fallback content.`);
            
            return {
                id: lesson.id,
                title: lesson.title,
                difficulty: lesson.difficulty,
                duration: lesson.duration,
                category: lesson.category,
                description: lesson.description,
                content: this.fallbackContent[lessonId] || this.generateGenericContent(lesson),
                keyPoints: lesson.keyPoints,
                isAiGenerated: false,
                nextLessons: this.getNextLessons(lessonId),
                relatedLessons: this.getRelatedLessons(lessonId)
            };
        }
    }

    // Find lesson by ID across all difficulty levels
    findLessonById(lessonId) {
        const allLessons = [
            ...COMPREHENSIVE_LESSONS.beginner,
            ...COMPREHENSIVE_LESSONS.intermediate,
            ...COMPREHENSIVE_LESSONS.advanced,
            ...COMPREHENSIVE_LESSONS.expert
        ];
        
        return allLessons.find(lesson => lesson.id === lessonId);
    }

    // Get next recommended lessons
    getNextLessons(currentLessonId) {
        const lesson = this.findLessonById(currentLessonId);
        if (!lesson) return [];

        const sameDifficultyLessons = COMPREHENSIVE_LESSONS[lesson.difficulty.toLowerCase()];
        const currentIndex = sameDifficultyLessons.findIndex(l => l.id === currentLessonId);
        
        // Return next 2 lessons from same difficulty or move to next level
        const nextInSameLevel = sameDifficultyLessons.slice(currentIndex + 1, currentIndex + 3);
        return nextInSameLevel;
    }

    // Get learning statistics
    getLearningStats() {
        const stats = {
            totalLessons: 0,
            byDifficulty: {},
            byCategory: {}
        };

        Object.keys(COMPREHENSIVE_LESSONS).forEach(difficulty => {
            const lessons = COMPREHENSIVE_LESSONS[difficulty];
            stats.totalLessons += lessons.length;
            stats.byDifficulty[difficulty] = lessons.length;

            lessons.forEach(lesson => {
                const category = lesson.category;
                stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
            });
        });

        return stats;
    }

    // Get all categories
    getCategories() {
        return Object.keys(LEARNING_CATEGORIES);
    }

    // Get all difficulty levels
    getDifficultyLevels() {
        return Object.keys(DIFFICULTY_LEVELS);
    }

    // Search lessons by title, description, or keywords
    searchLessons(query) {
        const allLessons = [
            ...COMPREHENSIVE_LESSONS.beginner,
            ...COMPREHENSIVE_LESSONS.intermediate,
            ...COMPREHENSIVE_LESSONS.advanced,
            ...COMPREHENSIVE_LESSONS.expert
        ];

        const searchTerm = query.toLowerCase();
        
        return allLessons.filter(lesson => 
            lesson.title.toLowerCase().includes(searchTerm) ||
            lesson.description.toLowerCase().includes(searchTerm) ||
            lesson.category.toLowerCase().includes(searchTerm) ||
            lesson.keyPoints.some(point => point.toLowerCase().includes(searchTerm))
        );
    }

    // Get related lessons based on category and difficulty
    getRelatedLessons(lessonId) {
        const lesson = this.findLessonById(lessonId);
        if (!lesson) return [];

        const allLessons = [
            ...COMPREHENSIVE_LESSONS.beginner,
            ...COMPREHENSIVE_LESSONS.intermediate,
            ...COMPREHENSIVE_LESSONS.advanced,
            ...COMPREHENSIVE_LESSONS.expert
        ];

        return allLessons
            .filter(l => 
                l.id !== lessonId && 
                (l.category === lesson.category || l.difficulty === lesson.difficulty)
            )
            .slice(0, 3);
    }

    // Generate generic content for lessons when AI is unavailable
    generateGenericContent(lesson) {
        return `
# ${lesson.title}

## Overview
${lesson.description}

## Key Learning Points
${lesson.keyPoints.map(point => `• ${point}`).join('\n')}

## Duration
This lesson typically takes ${lesson.duration} to complete.

## Difficulty Level
This is a ${lesson.difficulty} level lesson suitable for investors with ${lesson.difficulty === 'Beginner' ? 'no prior experience' : lesson.difficulty === 'Intermediate' ? 'basic knowledge' : lesson.difficulty === 'Advanced' ? 'good understanding' : 'extensive experience'} in stock market investing.

## Next Steps
After completing this lesson, consider exploring related topics in the ${lesson.category} category or advancing to the next difficulty level.

*Note: This is fallback content. For enhanced, AI-generated content with examples and practical tips, please ensure the AI service is available.*
        `.trim();
    }

    // Generate fallback content for all lessons
    generateFallbackContent() {
        const fallback = {};
        
        Object.values(COMPREHENSIVE_LESSONS).flat().forEach(lesson => {
            fallback[lesson.id] = this.generateGenericContent(lesson);
        });

        return fallback;
    }
}

export default new ComprehensiveLearningService();