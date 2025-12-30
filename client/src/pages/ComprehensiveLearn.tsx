import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
    BookOpen, 
    Clock, 
    Search,
    TrendingUp,
    Target,
    PlayCircle,
    RefreshCw
} from "lucide-react"
import { useState, useEffect } from "react"
import { getLearningList } from "@/lib/api"

interface Lesson {
    id: string;
    title: string;
    difficulty: string;
    duration: string;
    category: string;
    description: string;
}

export default function ComprehensiveLearn() {
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedDifficulty, setSelectedDifficulty] = useState("all")

    const fetchLessons = async () => {
        setLoading(true)
        try {
            const res = await getLearningList()
            if (res.status === "success") {
                const allLessons = [
                    ...(res.data.beginner || []),
                    ...(res.data.intermediate || []),
                    ...(res.data.advanced || []),
                    ...(res.data.expert || [])
                ]
                setLessons(allLessons)
                setFilteredLessons(allLessons)
            }
        } catch (error) {
            console.error("Failed to fetch lessons:", error)
        } finally {
            setLoading(false)
        }
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
                            <Card key={lesson.id} className="hover:shadow-md transition-shadow">
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
                                        <Button size="sm" className="gap-2">
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
            </div>
        </div>
    )
}