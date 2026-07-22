import React from 'react';

type SeoMeta = {
  title: string;
  description: string;
  [key: string]: unknown;
};

type BlogArticleLayoutProps = {
  title?: string;
  description?: string;
  seoMeta?: SeoMeta;
  children: React.ReactNode;
};

const BlogArticleLayout = ({
  title,
  description,
  seoMeta,
  children,
}: BlogArticleLayoutProps) => {
  const displayTitle = title || seoMeta?.title || '';
  const displayDesc = description || seoMeta?.description || '';

  return (
    <main className="bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        {(displayTitle || displayDesc) && (
          <header className="border-b pb-8 mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
              Blog Article
            </p>
            {displayTitle && (
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                {displayTitle}
              </h1>
            )}
            {displayDesc && (
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {displayDesc}
              </p>
            )}
          </header>
        )}
        <div>{children}</div>
      </div>
    </main>
  );
};

export default BlogArticleLayout;
export { BlogArticleLayout };