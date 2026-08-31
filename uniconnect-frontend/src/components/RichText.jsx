const RichText = ({ text, className }) => {
  if (!text) return null;
  const lines = String(text).split('\n');

  const parseInline = (line) => {
    const parts = [];
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
    let last = 0; let m; let key = 0;
    while ((m = regex.exec(line))) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      const tok = m[0];
      if (tok.startsWith('**')) parts.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
      else if (tok.startsWith('__')) parts.push(<u key={key++}>{tok.slice(2, -2)}</u>);
      else if (tok.startsWith('~~')) parts.push(<s key={key++}>{tok.slice(2, -2)}</s>);
      else if (tok.startsWith('`')) parts.push(<code key={key++} className="bg-black bg-opacity-10 px-1 rounded text-xs">{tok.slice(1, -1)}</code>);
      else if (tok.startsWith('[')) {
        const mm = tok.match(/\[([^\]]+)\]\(([^)]+)\)/);
        parts.push(<a key={key++} href={mm[2]} target="_blank" rel="noreferrer" className="text-blue-500 underline">{mm[1]}</a>);
      } else parts.push(<em key={key++}>{tok.slice(1, -1)}</em>);
      last = m.index + tok.length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return parts;
  };

  return (
    <div className={className}>
      {lines.map((l, i) => {
        if (l.startsWith('# ')) return <h3 key={i} className="text-lg font-extrabold mt-2 mb-1">{parseInline(l.slice(2))}</h3>;
        if (l.startsWith('## ')) return <h4 key={i} className="text-base font-bold mt-2 mb-1">{parseInline(l.slice(3))}</h4>;
        if (l.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-blue-400 pl-3 italic opacity-80 my-1">{parseInline(l.slice(2))}</blockquote>;
        if (l.startsWith('- ')) return <p key={i} className="pl-4 my-0.5">• {parseInline(l.slice(2))}</p>;
        return <p key={i} className="mb-1 last:mb-0">{parseInline(l)}</p>;
      })}
    </div>
  );
};

export default RichText;