import Markdown from 'markdown-to-jsx';

type MarkdownArticleProps = {
  content?: string;
  markdown?: string;
};

const MarkdownArticle = ({ content, markdown }: MarkdownArticleProps) => (
  <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-foreground prose-h1:mt-0 prose-h1:text-3xl prose-h1:leading-tight prose-h2:mt-10 prose-h2:border-t prose-h2:border-border prose-h2:pt-6 prose-h2:text-2xl prose-h2:leading-snug prose-h3:mt-8 prose-h3:text-xl prose-h3:leading-snug prose-p:text-base prose-p:leading-7 prose-p:text-muted-foreground prose-li:leading-7 prose-li:text-muted-foreground prose-strong:text-foreground prose-code:rounded prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.9em] prose-code:font-medium prose-pre:rounded-xl prose-pre:bg-secondary prose-pre:p-5 prose-a:text-primary prose-a:decoration-primary/30 prose-a:underline-offset-4 hover:prose-a:text-primary/80 prose-ul:list-disc prose-ol:list-decimal">
    <Markdown
      options={{
        forceBlock: true,
        overrides: {
          a: {
            props: {
              className: 'font-medium',
            },
          },
          code: {
            props: {
              className: '',
            },
          },
          pre: {
            props: {
              className: 'overflow-x-auto',
            },
          },
        },
      }}
    >
      {content || markdown || ''}
    </Markdown>
  </div>
);

export default MarkdownArticle;
export { MarkdownArticle };