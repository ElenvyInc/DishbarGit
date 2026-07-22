import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBlogPost, getPostSeoMeta } from '@/lib/blog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import DishBarLogo from '@/components/DishBarLogo';
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
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/blog')} className="cursor-pointer gap-2">
            <ArrowLeft className="w-4 h-4" /> Blog
          </Button>
          <DishBarLogo size="sm" />
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="cursor-pointer">
            Home
          </Button>
        </div>
      </header>

      <BlogArticleLayout title={post.title} description={post.description}>
        <MarkdownArticle content={post.markdown} />
      </BlogArticleLayout>

      {/* Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <Link to="/blog" className="text-sm font-medium text-primary hover:underline">
            ← Back to all articles
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            © 2026 DishBar. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BlogPostPage;