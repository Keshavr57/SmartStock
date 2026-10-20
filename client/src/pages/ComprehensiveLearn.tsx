import { 
    BookOpen, 
    Clock, 
    Search,
    Target,
    PlayCircle,
    RefreshCw,
    ArrowLeft,
    CheckCircle,
    BarChart3,
    TrendingUp,
    Briefcase,
    FileText
} from "lucide-react"
import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import { Badge as DsBadge, Page, PageHeader } from "@/components/ds"

// Lesson typography: readable line length and spacing without the typography plugin.
const LESSON_MARKDOWN: Components = {
    h1: ({ children }) => <h2 className="text-xl font-semibold mt-8 mb-3 first:mt-0 text-zinc-900 dark:text-zinc-50">{children}</h2>,
    h2: ({ children }) => <h2 className="text-xl font-semibold mt-8 mb-3 first:mt-0 text-zinc-900 dark:text-zinc-50">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-semibold mt-6 mb-2 text-zinc-900 dark:text-zinc-100">{children}</h3>,
    p: ({ children }) => <p className="text-[15px] leading-7 text-zinc-700 dark:text-zinc-300 my-3 max-w-3xl">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-5 my-3 space-y-1.5 text-[15px] leading-7 text-zinc-700 dark:text-zinc-300 max-w-3xl">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 my-3 space-y-1.5 text-[15px] leading-7 text-zinc-700 dark:text-zinc-300 max-w-3xl">{children}</ol>,
    strong: ({ children }) => <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{children}</strong>,
    blockquote: ({ children }) => <blockquote className="border-l-2 border-brand-500 pl-4 my-4 text-zinc-600 dark:text-zinc-400">{children}</blockquote>,
    code: ({ children }) => <code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[13px]">{children}</code>,
    table: ({ children }) => <div className="overflow-x-auto my-4"><table className="text-sm border border-zinc-200 dark:border-zinc-800">{children}</table></div>,
    th: ({ children }) => <th className="px-3 py-2 text-left font-medium bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">{children}</th>,
    td: ({ children }) => <td className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">{children}</td>
}
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
        <Page>
            <div className="space-y-4">
                {viewMode === 'list' ? (
                    <>
                        <PageHeader
                            title="Learn"
                            description={`${lessons.length} modules on Indian markets, from how stocks work to valuation, technical analysis and risk. Practise each idea on the Trade screen with virtual money.`}
                        />

                        {/* Search and Filters */}
                        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative flex-1 w-full max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Search modules..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-brand-600 dark:focus:border-brand-300 shadow-inner font-medium"
                                />
                            </div>
                            
                            <div className="flex gap-4 w-full md:w-auto">
                                <select
                                    className="flex-1 md:w-auto px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-white font-medium focus:outline-none focus:border-brand-600 dark:focus:border-brand-300"
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
                                    className="bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-colors border border-zinc-200 dark:border-zinc-600 hover:border-brand-600 dark:hover:border-brand-300 hover:text-brand-600 flex items-center justify-center gap-2"
                                >
                                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Lessons Grid */}
                        {loading ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 animate-pulse">
                                        <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-700 rounded-xl mb-4"></div>
                                        <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded mb-4 w-3/4"></div>
                                        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded mb-2 w-full"></div>
                                        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded mb-6 w-2/3"></div>
                                        <div className="h-10 bg-zinc-100 dark:bg-zinc-900 rounded-xl w-full"></div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredLessons.length === 0 ? (
                            <div className="py-16 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center text-center">
                                <BookOpen className="h-16 w-16 text-zinc-300 dark:text-zinc-600 mb-4" />
                                <h3 className="text-xl font-semibold text-zinc-800 dark:text-white tracking-tight">No Modules Found</h3>
                                <p className="text-zinc-500 font-medium">Try adjusting your filters.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredLessons.map((lesson) => (
                                    <div key={lesson.id} className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-brand-600/30 hover: transition-all flex flex-col group cursor-pointer" onClick={() => handleStartLesson(lesson.id)}>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-12 h-12 bg-[#e9edff]-container-low dark:bg-brand-600/20 text-brand-600 dark:text-brand-300 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                {getCategoryIcon(lesson.category)}
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${lesson.difficulty.toLowerCase() === 'beginner' ? 'bg-green-500/10 text-green-600' : lesson.difficulty.toLowerCase() === 'intermediate' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'}`}>
                                                {lesson.difficulty}
                                            </span>
                                        </div>
                                        
                                        <h3 className="text-xl font-semibold text-zinc-800 dark:text-white mb-3 group-hover:text-brand-600 transition-colors leading-tight">
                                            {lesson.title}
                                        </h3>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 line-clamp-3 leading-relaxed flex-1">
                                            {lesson.description}
                                        </p>
                                        
                                        <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-auto">
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400">
                                                <Clock className="w-4 h-4" /> {lesson.duration}
                                            </div>
                                            <button 
                                                className="bg-brand-600/10 text-brand-600 dark:bg-brand-600/20 dark:text-brand-300 px-4 py-2 rounded-xl font-bold text-xs hover:bg-brand-600 hover:text-white dark:hover:bg-brand-300 dark:hover:text-zinc-900 transition-colors flex items-center gap-1"
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
                                <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-brand-600" />
                                <p className="text-zinc-500 font-bold text-sm">Preparing Module...</p>
                            </div>
                        ) : currentLesson ? (
                            <>
                                <button 
                                    onClick={handleBackToList}
                                    className=" text-[11px] font-semibold text-zinc-500 hover:text-brand-600 transition-colors flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back to Modules
                                </button>

                                <header className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <DsBadge tone="brand">{currentLesson.category}</DsBadge>
                                        <DsBadge tone={currentLesson.difficulty.toLowerCase() === 'beginner' ? 'up' : currentLesson.difficulty.toLowerCase() === 'intermediate' ? 'warn' : 'down'}>{currentLesson.difficulty}</DsBadge>
                                        <span className="flex items-center gap-1 text-xs text-zinc-500"><Clock className="w-3.5 h-3.5" /> {currentLesson.duration}</span>
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{currentLesson.title}</h1>
                                    <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-2xl">{currentLesson.description}</p>
                                </header>

                                <article className="bg-white dark:bg-zinc-900 rounded-xl px-5 py-6 md:px-8 border border-zinc-200 dark:border-zinc-800">
                                    <ReactMarkdown components={LESSON_MARKDOWN}>{currentLesson.content}</ReactMarkdown>
                                </article>

                                {currentLesson.keyPoints && currentLesson.keyPoints.length > 0 && (
                                    <div className="bg-[#e9edff]-container-lowest dark:bg-zinc-900 rounded-xl p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
                                        <h2 className="text-xl font-semibold text-zinc-800 dark:text-white mb-6 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center">
                                                <Target className="w-4 h-4" />
                                            </div>
                                            Key Takeaways
                                        </h2>
                                        <ul className="space-y-4">
                                            {currentLesson.keyPoints.map((point, index) => (
                                                <li key={index} className="flex items-start gap-3">
                                                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {currentLesson.nextLessons && currentLesson.nextLessons.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-zinc-400 mb-4">Up Next</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {currentLesson.nextLessons.map((nextLesson) => (
                                                <div key={nextLesson.id} className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-brand-600/50 cursor-pointer group transition-colors" onClick={() => handleStartLesson(nextLesson.id)}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="text-brand-600 dark:text-brand-300">{getCategoryIcon(nextLesson.category)}</span>
                                                        <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded">
                                                            {nextLesson.difficulty}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-semibold text-zinc-800 dark:text-white mb-1 group-hover:text-brand-600 transition-colors">{nextLesson.title}</h4>
                                                    <p className="text-xs font-medium text-zinc-500 mb-4 line-clamp-2">{nextLesson.description}</p>
                                                    <button className="text-[11px] font-semibold text-brand-600 dark:text-brand-300 flex items-center gap-1 group-hover:gap-2 transition-all">
                                                        Start Module <ArrowLeft className="w-3 h-3 rotate-180" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                                <BookOpen className="h-16 w-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
                                <p className="text-zinc-800 dark:text-white font-semibold text-xl mb-4">Module not found</p>
                                <button 
                                    onClick={handleBackToList}
                                    className="bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors"
                                >
                                    Back to Academy
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Page>
    )
}
