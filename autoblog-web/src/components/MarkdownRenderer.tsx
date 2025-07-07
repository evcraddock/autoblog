import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import DOMPurify from 'dompurify'
interface MarkdownRendererProps {
  content: string
  className?: string
  isDark?: boolean
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  isDark = false,
}) => {
  const sanitizedContent = useMemo(() => {
    return DOMPurify.sanitize(content, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
    })
  }, [content])

  return (
    <div
      className={`prose ${isDark ? 'prose-invert' : ''} prose-lg max-w-none ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ node: _node, ...props }) => {
            const isExternal = props.href?.startsWith('http')
            return (
              <a
                {...props}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
              />
            )
          },
          img: ({ node: _node, ...props }) => (
            <img
              {...props}
              loading="lazy"
              className="rounded-lg shadow-md"
              onError={e => {
                const target = e.target as HTMLImageElement
                target.src =
                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDlWN0EyIDIgMCAwIDAgMTkgNUg1QTIgMiAwIDAgMCAzIDdWMTdBMiAyIDAgMCAwIDUgMTlIMTlBMiAyIDAgMCAwIDIxIDE3VjE1TTIxIDlMMTkgN0w3IDEzTDkgMTVMMjEgOVoiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K'
                target.alt = 'Image failed to load'
              }}
            />
          ),
          table: ({ node: _node, ...props }) => (
            <div className="overflow-x-auto">
              <table
                {...props}
                className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
              />
            </div>
          ),
          code: ({ node: _node, className, children, ...props }) => {
            const isInline = !className?.includes('language-')
            return !isInline ? (
              <code className={`${className} block p-4 rounded-lg`} {...props}>
                {children}
              </code>
            ) : (
              <code
                className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm"
                {...props}
              >
                {children}
              </code>
            )
          },
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
