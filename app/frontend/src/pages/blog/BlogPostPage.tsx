import { useParams, useNavigate } from 'react-router-dom';
import { getBlogPost, getPostSeoMeta } from '@/lib/blog';
import { Button } from '@/components/ui/button';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';
import { BlogArticleLayout } from '@/components/blog/BlogArticleLayout';
import { MarkdownArticle } from '@/components/blog/MarkdownArticle';
import { useEffect } from 'react';

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = slug ? getBlogPost(slug) : undefined;
  const seoMeta = getPostSeoMeta(post);

  useEffect(() => {
    if (seoMeta.title) {
      document.title = seoMeta.title;
    }
  }, [seoMeta.title]);

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Article not found</h1>
        <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/blog')} className="cursor-pointer">
          Back to Blog
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <SiteHeader variant="compact" onBack={() => navigate('/blog')} backLabel="Blog" />

      <BlogArticleLayout title={post.title} description={post.description}>
        <MarkdownArticle content={post.markdown} />
      </BlogArticleLayout>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
};

export default BlogPostPage;