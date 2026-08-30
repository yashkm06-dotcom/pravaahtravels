import { useMemo, useState } from 'react';
import { Calendar, Check, Copy, Facebook, MessageCircle, Tag, Twitter, User } from 'lucide-react';
import type { BlogPost } from '../types';
import { getTravelImage } from '../utils/imageFallback';
import { formatBlogDate, getBlogExcerpt, getBlogRouteSegment, renderBlogContent } from '../utils/blogContent';
import Breadcrumbs from './Breadcrumbs';
import TravelMedia from './TravelMedia';

interface BlogDetailViewProps {
  post: BlogPost;
  allPosts: BlogPost[];
  onNavigate: (view: string, blogId?: string | null) => void;
}

export default function BlogDetailView({ post, allPosts, onNavigate }: BlogDetailViewProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/blogs/${getBlogRouteSegment(post)}`
    : `/blogs/${getBlogRouteSegment(post)}`;

  const relatedPosts = useMemo(() => {
    return allPosts
      .filter((item) => item.status === 'Publish' && item.id !== post.id)
      .filter((item) => item.category === post.category || (item.tags || []).some((tag) => (post.tags || []).includes(tag)))
      .slice(0, 3);
  }, [allPosts, post]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked by the browser; the share links below still work.
    }
  };

  const shareLinks = [
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${post.title} — ${shareUrl}`)}`,
    },
    {
      label: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: 'X',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`,
    },
  ];

  return (
    <div id="blog-detail-view" className="animate-fade-in bg-white pb-20">
      <Breadcrumbs
        items={[
          { label: 'Blog', onClick: () => onNavigate('blogs') },
          { label: post.title, active: true },
        ]}
        onHomeClick={() => onNavigate('home')}
      />

      <div className="mx-auto max-w-[900px] px-4 pt-10 sm:px-6 lg:px-8">
        {post.category && (
          <span className="inline-block rounded-full bg-[#4DA528]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#4DA528]">
            {post.category}
          </span>
        )}
        <h1 className="mt-4 text-[32px] font-extrabold leading-tight text-stone-950 sm:text-[44px]">
          {post.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-stone-100 pb-6 text-sm text-stone-500">
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4 text-[#4DA528]" />
            {post.author || 'Pravaah Travels'}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-[#4DA528]" />
            {formatBlogDate(post.createdAt)}
          </span>
        </div>

        {post.featuredImageUrl && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[16px] border border-stone-200 bg-stone-100">
            <TravelMedia
              src={getTravelImage(post.featuredImageUrl)}
              alt={post.title}
              className="h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Share:</span>
          {shareLinks.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share on ${label}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition hover:border-[#4DA528] hover:text-[#4DA528]"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Copy link"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition hover:border-[#4DA528] hover:text-[#4DA528]"
          >
            {linkCopied ? <Check className="h-4 w-4 text-[#4DA528]" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <div className="mt-4 text-[15px]">
          {renderBlogContent(post.content)}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-6">
            <Tag className="h-4 w-4 text-stone-400" />
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {relatedPosts.length > 0 && (
        <div className="mx-auto mt-16 max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-stone-950">Related Articles</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((related) => (
              <article
                key={related.id}
                onClick={() => onNavigate('blog-detail', getBlogRouteSegment(related))}
                className="group cursor-pointer overflow-hidden rounded-[14px] border border-stone-200 bg-white shadow-[0_10px_28px_rgba(18,38,32,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(18,38,32,0.12)]"
              >
                <div className="aspect-[16/10] overflow-hidden bg-stone-100">
                  <TravelMedia
                    src={getTravelImage(related.featuredImageUrl)}
                    alt={related.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="line-clamp-2 text-sm font-bold leading-snug text-stone-950 transition group-hover:text-[#4DA528]">
                    {related.title}
                  </h3>
                  <p className="line-clamp-2 text-xs leading-5 text-stone-500">{getBlogExcerpt(related.content, 90)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
