import React from 'react';

/**
 * Renders the small subset of Markdown that LLM responses use
 * (paragraphs, **bold**, *italic*, bullet and numbered lists, # headings)
 * as plain React elements: no HTML injection, no dependencies.
 */
function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g);
  return parts.filter(Boolean).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={`${keyPrefix}-${i}`}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>;
  });
}

export const AIText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const lines = (text || '').replace(/\r/g, '').split('\n');
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag key={`l${blocks.length}`} className={`${list.ordered ? 'list-decimal' : 'list-disc'} pl-5 space-y-1`}>
        {list.items.map((item, i) => <li key={i}>{inline(item, `li${blocks.length}-${i}`)}</li>)}
      </Tag>
    );
    list = null;
  };

  lines.forEach((raw) => {
    const line = raw.trim();
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const ordered = !!numbered;
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push((bullet || numbered)![1]);
      return;
    }
    flushList();
    if (!line) return;
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      blocks.push(<p key={`h${blocks.length}`} className="font-bold">{inline(heading[1], `h${blocks.length}`)}</p>);
    } else {
      blocks.push(<p key={`p${blocks.length}`}>{inline(line, `p${blocks.length}`)}</p>);
    }
  });
  flushList();

  return <div className={`space-y-2 ${className}`}>{blocks}</div>;
};
