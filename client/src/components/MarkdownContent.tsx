import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '@/lib/utils';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className }) => {
  return (
    <div className={cn('markdown-renderer', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-4 mb-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-3 mb-2" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-base font-bold mt-3 mb-1" {...props} />,
          h5: ({ node, ...props }) => <h5 className="text-base font-bold mt-2 mb-1" {...props} />,
          h6: ({ node, ...props }) => <h6 className="text-sm font-bold mt-2 mb-1" {...props} />,
          p: ({ node, ...props }) => <p className="my-2" {...props} />,
          a: ({ node, ...props }) => (
            <a 
              className="text-primary hover:underline" 
              target="_blank" 
              rel="noreferrer noopener" 
              {...props} 
            />
          ),
          ul: ({ node, ...props }) => <ul className="list-disc ml-6 my-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal ml-6 my-2" {...props} />,
          li: ({ node, ...props }) => <li className="my-1" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote 
              className="pl-4 border-l-4 border-primary/30 my-2 text-white/80 italic"
              {...props} 
            />
          ),
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <pre className="bg-[rgba(0,0,0,0.3)] p-4 rounded-md my-3 overflow-auto">
                <code
                  className={match ? `language-${match[1]}` : ''}
                  {...props}
                >
                  {children}
                </code>
              </pre>
            ) : (
              <code
                className="bg-[rgba(255,255,255,0.1)] px-1.5 py-0.5 rounded text-white font-mono text-sm"
                {...props}
              >
                {children}
              </code>
            );
          },
          table: ({ node, ...props }) => (
            <div className="my-4 overflow-auto">
              <table className="min-w-full border border-primary/20 rounded" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-[rgba(255,255,255,0.05)]" {...props} />,
          tbody: ({ node, ...props }) => <tbody {...props} />,
          tr: ({ node, ...props }) => <tr className="border-b border-primary/20" {...props} />,
          th: ({ node, ...props }) => (
            <th 
              className="px-4 py-2 text-left font-semibold border-r border-primary/20 last:border-r-0" 
              {...props} 
            />
          ),
          td: ({ node, ...props }) => (
            <td 
              className="px-4 py-2 border-r border-primary/20 last:border-r-0" 
              {...props} 
            />
          ),
          hr: ({ node, ...props }) => <hr className="my-4 border-primary/20" {...props} />,
          img: ({ node, alt, ...props }) => (
            <img 
              alt={alt} 
              className="max-w-full h-auto rounded my-2" 
              {...props} 
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent; 