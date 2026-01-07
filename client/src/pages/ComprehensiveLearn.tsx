import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
    BookOpen, 
    Clock, 
    Search,
    Target,
    PlayCircle,
    RefreshCw,
    ArrowLeft,
    CheckCircle,
    ExternalLink
} from "lucide-react"
import { useState, useEffect } from "react"
import { getLearningList, getLessonContent } from "../lib/api"

interface Lesson {
    id: string;
    title: string;
    difficulty: string;
    duration: string;
    category: string;
    description: string;
}

interface LessonContent {
    id: string;
    title: string;
    difficulty: string;
    duration: string;
    category: string;
    description: string;
    content: string;
    keyPoints: string[];
    isAiGenerated: boolean;
    nextLessons: Lesson[];
    relatedLessons: Lesson[];
}

export default function ComprehensiveLearn() {
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedDifficulty, setSelectedDifficulty] = useState("all")
    
    // Lesson detail view state
    const [currentLesson, setCurrentLesson] = useState<LessonContent | null>(null)
    const [lessonLoading, setLessonLoading] = useState(false)
    const [viewMode, setViewMode] = useState<'list' | 'lesson'>('list')

    const fetchLessons = async () => {
        setLoading(true)
        try {
            console.log('🔍 Fetching lessons from API...')
            const res = await getLearningList()
            console.log('📚 Learning API response:', res)
            if (res.status === "success") {
                const allLessons = [
                    ...(res.data.beginner || []),
                    ...(res.data.intermediate || []),
                    ...(res.data.advanced || []),
                    ...(res.data.expert || [])
                ]
                console.log('📖 Total lessons loaded:', allLessons.length)
                setLessons(allLessons)
                setFilteredLessons(allLessons)
            }
        } catch (error) {
            console.error("❌ Failed to fetch lessons:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchLessonContent = async (lessonId: string) => {
        setLessonLoading(true)
        try {
            console.log('🔍 Fetching lesson content for:', lessonId)
            const res = await getLessonContent(lessonId)
            console.log('📚 Lesson content response:', res)
            if (res.status === "success") {
                setCurrentLesson(res.data)
                setViewMode('lesson')
                console.log('✅ Lesson loaded successfully:', res.data.title)
            }
        } catch (error) {
            console.error("❌ Failed to fetch lesson content:", error)
        } finally {
            setLessonLoading(false)
        }
    }

    const handleStartLesson = (lessonId: string) => {
        console.log('🚀 Starting lesson:', lessonId)
        fetchLessonContent(lessonId)
    }

    const handleBackToList = () => {
        setViewMode('list')
        setCurrentLesson(null)
    }

    useEffect(() => {
        fetchLessons()
    }, [])

    useEffect(() => {
        let filtered = lessons

        if (selectedDifficulty !== "all") {
            filtered = filtered.filter(lesson => 
                lesson.difficulty.toLowerCase() === selectedDifficulty
            )
        }

        if (searchQuery) {
            filtered = filtered.filter(lesson =>
                lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lesson.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lesson.category.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        setFilteredLessons(filtered)
    }, [searchQuery, selectedDifficulty, lessons])

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'beginner': return 'bg-green-100 text-green-800'
            case 'intermediate': return 'bg-yellow-100 text-yellow-800'
            case 'advanced': return 'bg-orange-100 text-orange-800'
            case 'expert': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'basics': return '📚'
            case 'analysis': return '📊'
            case 'trading': return '💹'
            case 'portfolio management': return '💼'
            case 'derivatives': return '🔄'
            default: return '📖'
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                {viewMode === 'list' ? (
                    <>
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Learn Trading & Investing
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Master the markets with our comprehensive learning modules
                            </p>
                        </div>

                        {/* Search and Filter */}
                        <Card className="mb-6">
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search lessons..."
                                            className="pl-10"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <select
                                        className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm"
                                        value={selectedDifficulty}
                                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                                    >
                                        <option value="all">All Levels</option>
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                        <option value="expert">Expert</option>
                                    </select>
                                    <Button 
                                        variant="outline" 
                                        onClick={fetchLessons}
                                        disabled={loading}
                                    >
                                        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                        Refresh
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lessons Grid */}
                        {loading ? (
                            <div className="text-center py-12">
                                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-500">Loading lessons...</p>
                            </div>
                        ) : filteredLessons.length === 0 ? (
                            <div className="text-center py-12">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-500">No lessons found</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredLessons.map((lesson) => (
                                    <Card key={lesson.id} className="hover:shadow-md transition-shadow cursor-pointer">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{getCategoryIcon(lesson.category)}</span>
                                                    <Badge className={getDifficultyColor(lesson.difficulty)}>
                                                        {lesson.difficulty}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-500">
                                                    <Clock className="h-4 w-4" />
                                                    <span className="text-sm">{lesson.duration}</span>
                                                </div>
                                            </div>
                                            <CardTitle className="text-lg font-semibold">
                                                {lesson.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                                {lesson.description}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                                    <Target className="h-4 w-4" />
                                                    <span>{lesson.category}</span>
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    className="gap-2"
                                                    onClick={() => handleStartLesson(lesson.id)}
                                                    disabled={lessonLoading}
                                                >
                                                    <PlayCircle className="h-4 w-4" />
                                                    Start
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Educational Note */}
                        <Card className="mt-8 bg-blue-50 border-blue-200">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-blue-800 mb-1">Educational Content</h3>
                                        <p className="text-sm text-blue-700">
                                            These lessons are for educational purposes only. Always do your own research and consult financial advisors before making investment decisions.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    /* Lesson Detail View */
                    <div className="max-w-4xl mx-auto">
                        {lessonLoading ? (
                            <div className="text-center py-12">
                                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-500">Loading lesson content...</p>
                            </div>
                        ) : currentLesson ? (
                            <>
                                {/* Back Button */}
                                <Button 
                                    variant="outline" 
                                    className="mb-6 gap-2"
                                    onClick={handleBackToList}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Lessons
                                </Button>

                                {/* Lesson Header */}
                                <Card className="mb-6">
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{getCategoryIcon(currentLesson.category)}</span>
                                                <Badge className={getDifficultyColor(currentLesson.difficulty)}>
                                                    {currentLesson.difficulty}
                                                </Badge>
                                                <div className="flex items-center gap-1 text-gray-500">
                                                    <Clock className="h-4 w-4" />
                                                    <span className="text-sm">{currentLesson.duration}</span>
                                                </div>
                                            </div>
                                            {currentLesson.isAiGenerated && (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                    AI Enhanced
                                                </Badge>
                                            )}
                                        </div>
                                        <CardTitle className="text-2xl font-bold mb-2">
                                            {currentLesson.title}
                                        </CardTitle>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {currentLesson.description}
                                        </p>
                                    </CardHeader>
                                </Card>

                                {/* Lesson Content */}
                                <Card className="mb-6">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BookOpen className="h-5 w-5" />
                                            Lesson Content
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="prose prose-gray dark:prose-invert max-w-none">
                                            <div 
                                                className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed"
                                                dangerouslySetInnerHTML={{ 
                                                    __html: currentLesson.content.replace(/\n/g, '<br/>') 
                                                }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Key Points */}
                                {currentLesson.keyPoints && currentLesson.keyPoints.length > 0 && (
                                    <Card className="mb-6">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <CheckCircle className="h-5 w-5" />
                                                Key Takeaways
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {currentLesson.keyPoints.map((point, index) => (
                                                    <li key={index} className="flex items-start gap-2">
                                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                        <span className="text-gray-700 dark:text-gray-300">{point}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Next Lessons */}
                                {currentLesson.nextLessons && currentLesson.nextLessons.length > 0 && (
                                    <Card className="mb-6">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <ExternalLink className="h-5 w-5" />
                                                Continue Learning
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {currentLesson.nextLessons.map((nextLesson) => (
                                                    <Card key={nextLesson.id} className="hover:shadow-md transition-shadow cursor-pointer">
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-lg">{getCategoryIcon(nextLesson.category)}</span>
                                                                <Badge className={getDifficultyColor(nextLesson.difficulty)} size="sm">
                                                                    {nextLesson.difficulty}
                                                                </Badge>
                                                            </div>
                                                            <h4 className="font-semibold mb-1">{nextLesson.title}</h4>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                                                {nextLesson.description}
                                                            </p>
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline" 
                                                                className="w-full gap-2"
                                                                onClick={() => handleStartLesson(nextLesson.id)}
                                                            >
                                                                <PlayCircle className="h-4 w-4" />
                                                                Start Next
                                                            </Button>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Related Lessons */}
                                {currentLesson.relatedLessons && currentLesson.relatedLessons.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Target className="h-5 w-5" />
                                                Related Topics
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid md:grid-cols-3 gap-4">
                                                {currentLesson.relatedLessons.map((relatedLesson) => (
                                                    <Card key={relatedLesson.id} className="hover:shadow-md transition-shadow cursor-pointer">
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span>{getCategoryIcon(relatedLesson.category)}</span>
                                                                <Badge className={getDifficultyColor(relatedLesson.difficulty)} size="sm">
                                                                    {relatedLesson.difficulty}
                                                                </Badge>
                                                            </div>
                                                            <h4 className="font-semibold text-sm mb-1">{relatedLesson.title}</h4>
                                                            <Button 
                                                                size="sm" 
                                                                variant="ghost" 
                                                                className="w-full text-xs"
                                                                onClick={() => handleStartLesson(relatedLesson.id)}
                                                            >
                                                                Explore
                                                            </Button>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-500">Lesson not found</p>
                                <Button 
                                    variant="outline" 
                                    className="mt-4 gap-2"
                                    onClick={handleBackToList}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Lessons
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}