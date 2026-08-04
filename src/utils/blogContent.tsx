import React from 'react';
import type { BlogPost } from '../types';

export const getBlogRouteSegment = (post: Pick<BlogPost, 'id' | 'slug'>) => (
  post.slug && post.slug.trim() ? post.slug.trim() : String(post.id)
);

export const formatBlogDate = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Strips the lightweight markdown syntax used by the Blog CMS editor (#, ##, -, **) down to
// plain text, for card previews and SEO description fallbacks.
export const getBlogExcerpt = (content: string, maxLength = 160) => {
  const plain = String(content ?? '')
    .split('\n')
    .map((line) => line.replace(/^#{1,6}\s*/, '').replace(/^[-*]\s*/, '').replace(/\*\*/g, ''))
    .filter((line) => line.trim())
    .join(' ')
    .trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trim()}…`;
};

const renderInline = (text: string, keyPrefix: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 3) {
      return <strong key={`${keyPrefix}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={`${keyPrefix}-${index}`}>{part}</React.Fragment>;
  });
};

// Renders the Blog CMS's lightweight markdown (#, ##, -, **bold**) as real React elements —
// never dangerouslySetInnerHTML, matching how the rest of the app avoids raw HTML injection.
export const renderBlogContent = (content: string) => {
  const lines = String(content ?? '').split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="my-4 list-disc space-y-2 pl-6 text-stone-700">
        {listBuffer.map((item, idx) => (
          <li key={idx} className="leading-7">{renderInline(item, `li-${blocks.length}-${idx}`)}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      if (level === 1) {
        blocks.push(<h2 key={index} className="mt-8 mb-3 text-2xl font-extrabold text-stone-950">{renderInline(text, `h-${index}`)}</h2>);
      } else if (level === 2) {
        blocks.push(<h3 key={index} className="mt-6 mb-2 text-xl font-bold text-stone-950">{renderInline(text, `h-${index}`)}</h3>);
      } else {
        blocks.push(<h4 key={index} className="mt-5 mb-2 text-lg font-bold text-stone-900">{renderInline(text, `h-${index}`)}</h4>);
      }
      return;
    }

    if (/^[-*]\s+/.test(line)) {
      listBuffer.push(line.replace(/^[-*]\s+/, ''));
      return;
    }

    flushList();
    blocks.push(<p key={index} className="my-4 leading-8 text-stone-700">{renderInline(line, `p-${index}`)}</p>);
  });

  flushList();
  return blocks;
};
