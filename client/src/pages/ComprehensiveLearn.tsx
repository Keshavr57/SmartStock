import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
    PlayCircle, 
    BookOpen, 
    Star, 
    Clock, 
    X, 
    ChevronRight, 
    Loader2, 
    Search,
    Filter,
    TrendingUp,
    Award,
    Target,
    Users,
    BookMarked,
    ArrowRight,
    CheckCircle
} from "lucide-react"
import { useState, useEffect } from "react"
import { getLearningList, getLessonContent } from "@/lib/api"
import { cn } from "@/lib/utils"

interface Lesson {
    id: string;
    title: string;
    difficulty: string;
    duration: string;
    category: string;
    description: string;
    keyPoints: string[];
}

interface LessonContent {
    id: string;
    title: string;
    content: string;
    keyPoints: string[];
    nextLessons: Lesson[];
    relatedLessons: Lesson[];
    isAiGenerated: boolean;
}

export default function ComprehensiveLearn() {
    const [allLessons, setAllLessons] = useState<any>({})
    const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
    const [lessonContent, setLessonContent] = useState<LessonContent | null>(null)
    const [fetchingContent, setFetchingContent] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedDifficulty, setSelectedDifficulty] = useState("all")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [stats, setStats] = useState<any>({})
    const [categories, setCategories] = useState<any[]>([])
    const [difficultyLevels, setDifficultyLevels] = useState<any[]>([])

    useEffect(() => {
        const fetchLearning = async () => {
            try {
                const res = await getLearningList()
                if (res.status === "success") {
                    setAllLessons(res.data)
                    setStats(res.stats || {})
                    setCategories(res.categories || [])
                    setDifficultyLevels(res.difficultyLevels || [])
                    
                    // Flatten all lessons for initial display
                    const allLessonsList = [
                        ...(res.data.beginner || []),
                        ...(res.data.intermediate || []),
                        ...(res.data.advanced || []),
                        ...(res.data.expert || [])
                    ]
                    setFilteredLessons(allLessonsList)
                }
            } catch (error) {
                console.error("Failed to fetch courses:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchLearning()
    }, [])

    useEffect(() => {
        filterLessons()
    }, [searchQuery, selectedDifficulty, selectedCategory, allLessons])

    const filterLessons = () => {
        let lessons = [
            ...(allLessons.beginner || []),
            ...(allLessons.intermediate || []),
            ...(allLessons.advanced || []),
            ...(allLessons.expert || [])
        ]

        if (selectedDifficulty !== "all") {
            lessons = allLessons[selectedDifficulty] || []
        }

        if (selectedCategory !== "all") {
            lessons = lessons.filter((lesson: Lesson) => 
                lesson.category.toLowerCase().includes(selectedCategory.toLowerCase())
            )
        }

        if (searchQuery) {
            lessons = lessons.filter((lesson: Lesson) =>
                lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lesson.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lesson.category.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        setFilteredLessons(lessons)
    }

    const handleStartLearning = async (lesson: Lesson) => {
        setSelectedLesson(lesson)
        setFetchingContent(true)
        try {
            const res = await getLessonContent(lesson.id)
            if (res.status === "success") {
                setLessonContent(res.data)
            }
        } catch (error) {
            console.error("Failed to fetch lesson content:", error)
        } finally {
            setFetchingContent(false)
        }
    }

    const closeModal = () => {
        setSelectedLesson(null)
        setLessonContent(null)
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'beginner': return 'bg-green-100 text-green-800 border-green-200'
            case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'advanced': return 'bg-orange-100 text-orange-800 border-orange-200'
            case 'expert': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'basics': return '📚'
            case 'analysis': return '📊'
            case 'trading': return '💹'
            case 'portfolio management': return '💼'
            case 'derivatives': return '🔄'
            case 'getting started': return '🚀'
            case 'investment strategies': return '🎯'
            case 'risk management': return '🛡️'
            case 'ipo': return '🏢'
            case 'advanced trading': return '⚡'
            case 'global investing': return '🌍'
            case 'alternative investments': return '💎'
            case 'tax planning': return '📋'
            default: return '📖'
        }
    }

    return (
        <div className="p-6 container mx-auto space-y-8 min-h-screen">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                        <BookOpen className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">Learn Trading & Investing</h1>
                        <p className="text-muted-foreground text-lg">Master the markets with our comprehensive learning modules</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-muted/50 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                        <CardContent className="p-4 flex items-center gap-3">
                            <BookMarked className="h-8 w-8 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalLessons || 0}</p>
                                <p className="text-xs text-blue-700 dark:text-blue-300">Total Lessons</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-muted/50 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Target className="h-8 w-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{categories.length || 0}</p>
                                <p className="text-xs text-green-700 dark:text-green-300">Categories</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-muted/50 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Award className="h-8 w-8 text-purple-600" />
                            <div>
                                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">4</p>
                                <p className="text-xs text-purple-700 dark:text-purple-300">Skill Levels</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-muted/50 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Clock className="h-8 w-8 text-orange-600" />
                            <div>
                                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.estimatedHours || 0}h</p>
                                <p className="text-xs text-orange-700 dark:text-orange-300">Total Content</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-muted/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search lessons..."
                                className="pl-10 h-11 rounded-xl bg-background/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                className="px-4 py-2 rounded-xl border border-input bg-background text-sm"
                                value={selectedDifficulty}
                                onChange={(e) => setSelectedDifficulty(e.target.value)}
                            >
                                <option value="all">All Levels</option>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                                <option value="expert">Expert</option>
                            </select>
                            <select
                                className="px-4 py-2 rounded-xl border border-input bg-background text-sm"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                <option value="basics">Basics</option>
                                <option value="analysis">Analysis</option>
                                <option value="trading">Trading</option>
                                <option value="portfolio">Portfolio</option>
                                <option value="derivatives">Derivatives</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Lessons Grid */}
            {loading ? (
                <div className="py-20 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground animate-pulse">Loading comprehensive lessons...</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLessons.map((lesson) => (
                        <Card key={lesson.id} className="group hover:shadow-lg transition-all duration-300 border-muted/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{getCategoryIcon(lesson.category)}</span>
                                        <Badge className={cn("text-xs font-medium", getDifficultyColor(lesson.difficulty))}>
                                            {lesson.difficulty}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span className="text-xs">{lesson.duration}</span>
                                    </div>
                                </div>
                                <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                                    {lesson.title}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {lesson.description}
                                </p>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Target className="h-3 w-3" />
                                        <span>{lesson.category}</span>
                                    </div>
                                    <Button
                                        className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md group-hover:shadow-lg transition-all"
                                        onClick={() => handleStartLearning(lesson)}
                                    >
                                        <PlayCircle className="h-4 w-4 mr-2" />
                                        Start Learning
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {filteredLessons.length === 0 && !loading && (
                <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No lessons found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or filters</p>
                </div>
            )}

            {/* Enhanced Modal */}
            {selectedLesson && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                                    <span className="text-2xl">{getCategoryIcon(selectedLesson.category)}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge className={cn("text-xs", getDifficultyColor(selectedLesson.difficulty))}>
                                            {selectedLesson.difficulty}
                                        </Badge>
                                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {selectedLesson.duration}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold">{selectedLesson.title}</h2>
                                    <p className="text-sm text-muted-foreground">{selectedLesson.category}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={closeModal}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                            {fetchingContent ? (
                                <div className="py-16 flex flex-col items-center gap-4">
                                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                    <p className="text-muted-foreground font-medium animate-pulse">Loading lesson content...</p>
                                </div>
                            ) : lessonContent ? (
                                <div className="space-y-8">
                                    {/* Main Content */}
                                    <div className="bg-gradient-to-br from-primary/5 to-purple/5 p-6 rounded-2xl border border-primary/10">
                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                            <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                                                {lessonContent.content}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Key Points */}
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-xl flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-600" /> Key Takeaways
                                        </h4>
                                        <div className="grid gap-3">
                                            {lessonContent.keyPoints.map((point, index) => (
                                                <div key={index} className="flex items-start gap-3 bg-muted/40 p-4 rounded-xl border border-muted-foreground/10">
                                                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                                                    <span className="text-sm">{point}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Next Lessons */}
                                    {lessonContent.nextLessons && lessonContent.nextLessons.length > 0 && (
                                        <div className="space-y-4">
                                            <h4 className="font-bold text-xl flex items-center gap-2">
                                                <ArrowRight className="h-5 w-5 text-blue-600" /> Continue Learning
                                            </h4>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {lessonContent.nextLessons.map((nextLesson) => (
                                                    <Card key={nextLesson.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleStartLearning(nextLesson)}>
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge className={cn("text-xs", getDifficultyColor(nextLesson.difficulty))}>
                                                                    {nextLesson.difficulty}
                                                                </Badge>
                                                                <span className="text-xs text-muted-foreground">{nextLesson.duration}</span>
                                                            </div>
                                                            <h5 className="font-semibold text-sm">{nextLesson.title}</h5>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <Button
                                        className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:scale-[1.02] transition-transform"
                                        onClick={closeModal}
                                    >
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        Mark as Complete
                                    </Button>
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-muted-foreground">Failed to load content. Please try again.</p>
                                    <Button variant="outline" className="mt-4" onClick={() => handleStartLearning(selectedLesson)}>
                                        Retry
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}