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
    ExternalLink,
    BarChart3,
    TrendingUp,
    Briefcase,
    FileText
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
            // Handle error silently or show user-friendly message
        } finally {
            setLoading(false)
        }
    }

    const fetchLessonContent = async (lessonId: string) => {
        setLessonLoading(true)
        try {
            const res = await getLessonContent(lessonId)
            if (res.status === "success") {
                setCurrentLesson(res.data)
                setViewMode('lesson')
            }
        } catch (error) {
            // Handle error silently or show user-friendly message
        } finally {
            setLessonLoading(false)
        }
    }

    const handleStartLesson = (lessonId: string) => {
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
            case 'basics': return <BookOpen className="h-5 w-5" />
            case 'analysis': return <BarChart3 className="h-5 w-5" />
            case 'trading': return <TrendingUp className="h-5 w-5" />
            case 'portfolio management': return <Briefcase className="h-5 w-5" />
            case 'derivatives': return <RefreshCw className="h-5 w-5" />
            default: return <FileText className="h-5 w-5" />
        }
    }

    return (
        <section className="bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-64px)] p-4 md:p-8 border-t dark:border-slate-800" id="academy">
            <div className="max-w-7xl mx-auto space-y-8">
                {viewMode === 'list' ? (
                    <>
                        {/* Hero Section */}
                        <div className="bg-[#630ed4] dark:bg-[#4d0aab] p-8 md:p-12 rounded-3xl text-white shadow-xl shadow-[#630ed4]/20 relative overflow-hidden">
                            <div className="relative z-10 max-w-2xl">
                                <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight tracking-tight">Master the Markets</h1>
                                <p className="text-[#e9edff] text-lg font-medium mb-8">
                                    Comprehensive learning modules from basic concepts to advanced trading strategies, powered by AI.
                                </p>
                                <div className="flex gap-4">
                                    <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" /> {lessons.length} Modules
                                    </span>
                                </div>
                            </div>
                            {/* Decorative element */}
                            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
                                <Search className="w-96 h-96" />
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative flex-1 w-full max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search modules..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-[#630ed4] dark:focus:border-[#a975ff] shadow-inner font-medium"
                                />
                            </div>
                            
                            <div className="flex gap-4 w-full md:w-auto">
                                <select
                                    className="flex-1 md:w-auto px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-medium focus:outline-none focus:border-[#630ed4] dark:focus:border-[#a975ff]"
                                    value={selectedDifficulty}
                                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                                >
                                    <option value="all">All Levels</option>
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                    <option value="expert">Expert</option>
                                </select>
                                <button 
                                    onClick={fetchLessons}
                                    disabled={loading}
                                    className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-colors border border-slate-200 dark:border-slate-600 hover:border-[#630ed4] dark:hover:border-[#a975ff] hover:text-[#630ed4] flex items-center justify-center gap-2 uppercase tracking-widest"
                                >
                                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Lessons Grid */}
                        {loading ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 animate-pulse">
                                        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4"></div>
                                        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-4 w-3/4"></div>
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2 w-full"></div>
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-6 w-2/3"></div>
                                        <div className="h-10 bg-slate-100 dark:bg-slate-900 rounded-xl w-full"></div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredLessons.length === 0 ? (
                            <div className="py-16 bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center text-center">
                                <BookOpen className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">No Modules Found</h3>
                                <p className="text-slate-500 font-medium">Try adjusting your filters.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredLessons.map((lesson) => (
                                    <div key={lesson.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-[#630ed4]/30 hover:shadow-lg transition-all flex flex-col group cursor-pointer" onClick={() => handleStartLesson(lesson.id)}>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-12 h-12 bg-[#e9edff]-container-low dark:bg-[#630ed4]/20 text-[#630ed4] dark:text-[#a975ff] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                {getCategoryIcon(lesson.category)}
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${lesson.difficulty.toLowerCase() === 'beginner' ? 'bg-green-500/10 text-green-600' : lesson.difficulty.toLowerCase() === 'intermediate' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'}`}>
                                                {lesson.difficulty}
                                            </span>
                                        </div>
                                        
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-3 group-hover:text-[#630ed4] transition-colors leading-tight">
                                            {lesson.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-3 leading-relaxed flex-1">
                                            {lesson.description}
                                        </p>
                                        
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700 mt-auto">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <Clock className="w-4 h-4" /> {lesson.duration}
                                            </div>
                                            <button 
                                                className="bg-[#630ed4]/10 text-[#630ed4] dark:bg-[#630ed4]/20 dark:text-[#a975ff] px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#630ed4] hover:text-white dark:hover:bg-[#a975ff] dark:hover:text-slate-900 transition-colors flex items-center gap-1 uppercase tracking-widest"
                                                onClick={(e) => { e.stopPropagation(); handleStartLesson(lesson.id); }}
                                                disabled={lessonLoading}
                                            >
                                                Start <PlayCircle className="w-4 h-4 ml-1" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    /* Lesson Detail View */
                    <div className="max-w-4xl mx-auto space-y-6">
                        {lessonLoading ? (
                            <div className="text-center py-20">
                                <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-[#630ed4]" />
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Preparing Module...</p>
                            </div>
                        ) : currentLesson ? (
                            <>
                                <button 
                                    onClick={handleBackToList}
                                    className="uppercase tracking-widest text-[10px] font-black text-slate-500 hover:text-[#630ed4] transition-colors flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back to Modules
                                </button>

                                <div className="bg-[#630ed4] dark:bg-[#4d0aab] p-8 md:p-12 rounded-3xl text-white shadow-xl shadow-[#630ed4]/20">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                            {currentLesson.category}
                                        </span>
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${currentLesson.difficulty.toLowerCase() === 'beginner' ? 'bg-green-500/20 text-green-100' : currentLesson.difficulty.toLowerCase() === 'intermediate' ? 'bg-yellow-500/20 text-yellow-100' : 'bg-red-500/20 text-red-100'}`}>
                                            {currentLesson.difficulty}
                                        </span>
                                        <span className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {currentLesson.duration}
                                        </span>
                                        {currentLesson.isAiGenerated && (
                                            <span className="bg-green-500/30 text-green-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ml-auto">
                                                AI Generated
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight tracking-tight">
                                        {currentLesson.title}
                                    </h1>
                                    <p className="text-[#e9edff] text-lg font-medium opacity-90 max-w-2xl">
                                        {currentLesson.description}
                                    </p>
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white mb-8 border-b border-slate-100 dark:border-slate-700 pb-4 uppercase tracking-widest">
                                        Module Content
                                    </h2>
                                    <div className="prose prose-lg dark:prose-invert max-w-none prose-slate">
                                        <div 
                                            className="whitespace-pre-wrap leading-relaxed space-y-4"
                                            dangerouslySetInnerHTML={{ 
                                                __html: currentLesson.content.replace(/\n/g, '<br/>') 
                                            }}
                                        />
                                    </div>
                                </div>

                                {currentLesson.keyPoints && currentLesson.keyPoints.length > 0 && (
                                    <div className="bg-[#e9edff]-container-lowest dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                                        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#630ed4] text-white flex items-center justify-center">
                                                <Target className="w-4 h-4" />
                                            </div>
                                            Key Takeaways
                                        </h2>
                                        <ul className="space-y-4">
                                            {currentLesson.keyPoints.map((point, index) => (
                                                <li key={index} className="flex items-start gap-3">
                                                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {currentLesson.nextLessons && currentLesson.nextLessons.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Up Next</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {currentLesson.nextLessons.map((nextLesson) => (
                                                <div key={nextLesson.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-[#630ed4]/50 cursor-pointer group transition-colors" onClick={() => handleStartLesson(nextLesson.id)}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="text-[#630ed4] dark:text-[#a975ff]">{getCategoryIcon(nextLesson.category)}</span>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                                            {nextLesson.difficulty}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-black text-slate-800 dark:text-white mb-1 group-hover:text-[#630ed4] transition-colors">{nextLesson.title}</h4>
                                                    <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-2">{nextLesson.description}</p>
                                                    <button className="text-[10px] font-black uppercase tracking-widest text-[#630ed4] dark:text-[#a975ff] flex items-center gap-1 group-hover:gap-2 transition-all">
                                                        Start Module <ArrowLeft className="w-3 h-3 rotate-180" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                <BookOpen className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                                <p className="text-slate-800 dark:text-white font-black text-xl mb-4">Module not found</p>
                                <button 
                                    onClick={handleBackToList}
                                    className="bg-[#630ed4] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-[#4d0aab] transition-colors"
                                >
                                    Back to Academy
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    )
}
