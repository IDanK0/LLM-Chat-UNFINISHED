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
    <div className={cn('markdown-renderer', 'message-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold !mt-0 !mb-0" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold !mt-0 !mb-0" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold !mt-0 !mb-0" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-base font-bold !mt-0 !mb-0" {...props} />,
          h5: ({ node, ...props }) => <h5 className="text-base font-bold !mt-0 !mb-0" {...props} />,
          h6: ({ node, ...props }) => <h6 className="text-sm font-bold !mt-0 !mb-0" {...props} />,
          p: ({ node, ...props }) => <p className="!m-0" {...props} />,
          a: ({ node, ...props }) => (
            <a 
              className="text-primary hover:underline" 
              target="_blank" 
              rel="noreferrer noopener" 
              {...props} 
            />
          ),
          ul: ({ node, ...props }) => <ul className="list-disc ml-6 !m-0" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal ml-6 !m-0" {...props} />,
          li: ({ node, ...props }) => <li className="!m-0" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote 
              className="pl-4 border-l-4 border-primary/30 !m-0 text-white/80 italic"
              {...props} 
            />
          ),
          code: (props) => {
            const { node, inline, className, children, ...rest } = props as any;
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <pre className="bg-[rgba(0,0,0,0.3)] p-4 rounded-md !m-0 overflow-auto">
                <code
                  className={match ? `language-${match[1]}` : ''}
                  {...rest}
                >
                  {children}
                </code>
              </pre>
            ) : (
              <code
                className="bg-[rgba(255,255,255,0.1)] px-1 py-0 rounded text-white font-mono text-sm"
                {...rest}
              >
                {children}
              </code>
            );
          },
          table: ({ node, ...props }) => (
            <div className="!m-0 overflow-auto">
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
          hr: ({ node, ...props }) => <hr className="!m-0 border-primary/20" {...props} />,
          img: ({ node, alt, ...props }) => (
            <img 
              alt={alt} 
              className="max-w-full h-auto rounded !m-0" 
              {...props} 
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {/* Override any residual top/bottom margins on markdown children */}
      <style>{`
        .markdown-renderer * {
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default MarkdownContent; 