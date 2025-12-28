import axios from 'axios';
import { COMPREHENSIVE_LESSONS, LEARNING_CATEGORIES, DIFFICULTY_LEVELS } from '../data/comprehensiveLessons.js';

class ComprehensiveLearningService {
    constructor() {
        this.aiServiceUrl = 'http://127.0.0.1:8000';
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
        
        if (nextInSameLevel.length < 2) {
            const nextLevel = this.getNextDifficultyLevel(lesson.difficulty);
            if (nextLevel) {
                const nextLevelLessons = COMPREHENSIVE_LESSONS[nextLevel].slice(0, 2 - nextInSameLevel.length);
                return [...nextInSameLevel, ...nextLevelLessons];
            }
        }
        
        return nextInSameLevel;
    }

    // Get related lessons from same category
    getRelatedLessons(currentLessonId) {
        const lesson = this.findLessonById(currentLessonId);
        if (!lesson) return [];

        return this.getLessonsByCategory(lesson.category)
            .filter(l => l.id !== currentLessonId)
            .slice(0, 3);
    }

    // Get next difficulty level
    getNextDifficultyLevel(currentLevel) {
        const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
        const currentIndex = levels.indexOf(currentLevel.toLowerCase());
        return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
    }

    // Get learning categories
    getCategories() {
        return LEARNING_CATEGORIES;
    }

    // Get difficulty levels
    getDifficultyLevels() {
        return DIFFICULTY_LEVELS;
    }

    // Get learning statistics
    getLearningStats() {
        const allLessons = [
            ...COMPREHENSIVE_LESSONS.beginner,
            ...COMPREHENSIVE_LESSONS.intermediate,
            ...COMPREHENSIVE_LESSONS.advanced,
            ...COMPREHENSIVE_LESSONS.expert
        ];

        return {
            totalLessons: allLessons.length,
            byDifficulty: {
                beginner: COMPREHENSIVE_LESSONS.beginner.length,
                intermediate: COMPREHENSIVE_LESSONS.intermediate.length,
                advanced: COMPREHENSIVE_LESSONS.advanced.length,
                expert: COMPREHENSIVE_LESSONS.expert.length
            },
            categories: LEARNING_CATEGORIES.length,
            estimatedHours: Math.round(allLessons.reduce((total, lesson) => {
                return total + parseInt(lesson.duration);
            }, 0) / 60)
        };
    }

    // Generate fallback content for lessons
    generateFallbackContent() {
        return {
            'what-are-stocks': `Stocks represent ownership shares in a company. When you buy a stock, you become a partial owner of that business.

**Key Concepts:**
• **Ownership**: You own a piece of the company's assets and future profits
• **Dividends**: Some companies share profits with shareholders quarterly
• **Capital Appreciation**: Stock value can increase as company grows
• **Voting Rights**: Shareholders can vote on major company decisions

**Indian Context:**
Popular stocks like Reliance Industries, TCS, and HDFC Bank are traded on NSE and BSE. These represent ownership in some of India's largest companies.

**Getting Started:**
Start with blue-chip stocks from established companies. They're generally safer for beginners and provide steady returns over time.`,

            'fundamental-analysis': `Fundamental analysis evaluates a company's intrinsic value by examining its financial health, business model, and growth prospects.

**Key Ratios:**
• **P/E Ratio**: Price divided by earnings per share - shows if stock is expensive
• **ROE**: Return on Equity - measures how efficiently company uses shareholders' money  
• **Debt-to-Equity**: Shows company's financial leverage and risk level
• **Revenue Growth**: Indicates business expansion and market demand

**Indian Examples:**
TCS has consistently high ROE (>40%), showing efficient operations. Reliance's diversification across telecom, retail, and energy provides multiple growth avenues.

**Practical Tips:**
Compare companies within the same sector. A P/E of 25 might be reasonable for IT stocks but high for banking stocks.`
        };
    }

    // Generate generic content for lessons without specific fallback
    generateGenericContent(lesson) {
        return `# ${lesson.title}

${lesson.description}

This ${lesson.difficulty.toLowerCase()}-level lesson covers essential concepts that every investor should understand. The content focuses on practical applications in the Indian market context.

**Key Learning Points:**
${lesson.keyPoints.map(point => `• ${point}`).join('\n')}

**Duration:** ${lesson.duration}
**Category:** ${lesson.category}

This lesson provides foundational knowledge that will help you make better investment decisions and understand market dynamics more effectively.`;
    }

    // Search lessons by query
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
}

export default new ComprehensiveLearningService();