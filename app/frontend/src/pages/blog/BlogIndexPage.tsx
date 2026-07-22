import { Link, useNavigate } from 'react-router-dom';
import { blogPosts, getBlogRoute } from '@/lib/blog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, BookOpen } from 'lucide-react';
import DishBarLogo from '@/components/DishBarLogo';

const BlogIndexPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="cursor-pointer gap-2">
            <ArrowLeft className="w-4 h-4" /> Home
          </Button>
          <DishBarLogo size="sm" />
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-3xl space-y-4 mb-12">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="w-5 h-5" />
            <p className="text-sm font-semibold uppercase tracking-wider">
              DishBar Blog
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
            Discover Persian Cuisine & Home Cooking
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Explore articles about authentic Iranian cuisine, our talented home chefs, 
            and how DishBar is bringing traditional Persian flavours to Ontario.
          </p>
        </div>

        <div className="grid gap-6">
          {blogPosts.length > 0 ? (
            blogPosts.map((post) => (
              <Card
                key={post.slug}
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/20"
                onClick={() => navigate(getBlogRoute(post.slug))}
              >
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                    {post.frontmatter.date && <span>{post.frontmatter.date}</span>}
                    {post.frontmatter.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-primary/10 px-3 py-0.5 text-xs text-primary font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    <Link to={getBlogRoute(post.slug)}>
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-2 text-base text-muted-foreground leading-relaxed line-clamp-3">
                    {post.description}
                  </p>
                  <Link
                    to={getBlogRoute(post.slug)}
                    className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
                  >
                    Read article →
                  </Link>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-semibold text-foreground">No articles yet</h2>
                <p className="mt-2 text-muted-foreground">
                  Check back soon for articles about Persian cuisine and home cooking.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 DishBar. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default BlogIndexPage;