import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Chat typography for assistant answers: compact, with real tables (GFM).
const COMPONENTS: Components = {
    p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0 leading-relaxed">{children}</p>,
    h1: ({ children }) => <h3 className="mt-4 mb-2 first:mt-0 text-base font-semibold">{children}</h3>,
    h2: ({ children }) => <h3 className="mt-4 mb-2 first:mt-0 text-base font-semibold">{children}</h3>,
    h3: ({ children }) => <h4 className="mt-3 mb-1.5 first:mt-0 text-sm font-semibold">{children}</h4>,
    ul: ({ children }) => <ul className="my-2 pl-5 list-disc space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="my-2 pl-5 list-decimal space-y-1">{children}</ol>,
    strong: ({ children }) => <strong className="font-semibold text-zinc-900 dark:text-zinc-50">{children}</strong>,
    a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-brand-600 dark:text-brand-300 underline underline-offset-2">{children}</a>,
    code: ({ children }) => <code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[13px]">{children}</code>,
    blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-zinc-300 dark:border-zinc-700 pl-3 text-zinc-600 dark:text-zinc-400">{children}</blockquote>,
    hr: () => <hr className="my-4 border-zinc-200 dark:border-zinc-800" />,
    table: ({ children }) => (
        <div className="my-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-[13px] tabular-nums">{children}</table>
        </div>
    ),
    thead: ({ children }) => <thead className="bg-zinc-50 dark:bg-zinc-800/60">{children}</thead>,
    th: ({ children }) => <th className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-300 whitespace-nowrap">{children}</th>,
    td: ({ children }) => <td className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-800 align-top">{children}</td>
}

// Raw HTML from the model is never rendered (news text could inject markup); <br> inside table cells is
// the one tag models commonly emit, so it is turned into a visible separator instead.
const clean = (text: string) => text.replace(/<br\s*\/?>/gi, ' · ')

export default function Markdown({ children }: { children: string }) {
    return <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>{clean(children)}</ReactMarkdown>
}
