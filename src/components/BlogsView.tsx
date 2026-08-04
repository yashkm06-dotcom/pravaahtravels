import { useMemo, useState } from 'react';
import { BookOpen, Search, User } from 'lucide-react';
import type { BlogPost } from '../types';
import { getTravelImage } from '../utils/imageFallback';
import { formatBlogDate, getBlogExcerpt, getBlogRouteSegment } from '../utils/blogContent';
import { CardGridSkeletonLoader } from './SkeletonLoader';
import TravelMedia from './TravelMedia';

interface BlogsViewProps {
  blogPosts: BlogPost[];
  onNavigate: (view: string, blogId?: string | null) => void;
  loading: boolean;
}

export default function BlogsView({ blogPosts, onNavigate, loading }: BlogsViewProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const publishedPosts = useMemo(
    () => blogPosts.filter((post) => post.status === 'Publish'),
    [blogPosts],
  );

  const categories = useMemo(() => {
    const unique = new Set<string>();
    publishedPosts.forEach((post) => {
      if (post.category) unique.add(post.category);
    });
    return ['All', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [publishedPosts]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return publishedPosts
      .filter((post) => selectedCategory === 'All' || post.category === selectedCategory)
      .filter((post) => {
        if (!query) return true;
        return [post.title, post.content, post.category, ...(post.tags || [])]
          .some((field) => String(field ?? '').toLowerCase().includes(query));
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [publishedPosts, search, selectedCategory]);

  const handleOpenPost = (post: BlogPost) => onNavigate('blog-detail', getBlogRouteSegment(post));

  return (
    <div id="blogs-view" className="animate-fade-in bg-[#F7F8F4] py-20">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#4DA528]">Stories & Guides</span>
          <h1 className="text-[38px] font-extrabold leading-tight text-stone-950 sm:text-[56px]">
            The Pravaah Travel Journal
          </h1>
          <div className="mx-auto mt-3 h-0.5 w-16 bg-[#FF970D]" />
          <p className="mx-auto max-w-xl text-sm leading-7 text-stone-500 sm:text-base">
            Destination guides, travel tips, and stories from the Himalayas and beyond.
          </p>
        </div>

        <div className="mx-auto flex max-w-xl flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4DA528]" />
            <input
              type="text"
              placeholder="Search articles, destinations, topics..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-full border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm text-stone-800 shadow-sm focus:border-[#4DA528] focus:outline-none"
            />
          </div>

          {categories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2" id="blog-category-pills">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`cursor-pointer border px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    selectedCategory === category
                      ? 'border-[#4DA528] bg-[#4DA528] text-white shadow-sm'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-[#4DA528] hover:text-[#4DA528]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <CardGridSkeletonLoader count={6} />
        ) : filteredPosts.length === 0 ? (
          <div className="mx-auto max-w-lg space-y-3 rounded-[12px] border border-stone-200 bg-white p-12 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-stone-300" />
            <p className="text-xs font-light text-stone-400">
              {publishedPosts.length === 0
                ? 'No articles have been published yet. Check back soon.'
                : `No articles match "${search || selectedCategory}".`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3" id="blog-grid">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => handleOpenPost(post)}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-[16px] border border-stone-200 bg-white shadow-[0_12px_35px_rgba(18,38,32,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(18,38,32,0.14)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                  <TravelMedia
                    src={getTravelImage(post.featuredImageUrl)}
                    alt={post.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  {post.category && (
                    <span className="absolute left-4 top-4 rounded-full bg-[#4DA528] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                      {post.category}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <h2 className="line-clamp-2 text-lg font-extrabold leading-snug text-stone-950 transition group-hover:text-[#4DA528]">
                    {post.title}
                  </h2>
                  <p className="line-clamp-3 flex-1 text-sm leading-6 text-stone-500">
                    {getBlogExcerpt(post.content, 130)}
                  </p>
                  <div className="flex items-center justify-between border-t border-stone-100 pt-4 text-[11px] font-medium text-stone-400">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {post.author || 'Pravaah Travels'}
                    </span>
                    <span>{formatBlogDate(post.createdAt)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
