import React from 'react';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = '' }) => {
  // Parse markdown lines into structured blocks
  const parseBlocks = (text: string) => {
    const lines = text.split('\n');
    const blocks: React.ReactNode[] = [];
    let i = 0;

    const renderInline = (str: string): React.ReactNode => {
      // Inline formatting: code, bold, italic
      const parts: React.ReactNode[] = [];
      let current = str;
      let key = 0;

      // Regex matching code, bold, italic
      const inlineRegex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
      let lastIndex = 0;
      let match;

      while ((match = inlineRegex.exec(current)) !== null) {
        if (match.index > lastIndex) {
          parts.push(current.substring(lastIndex, match.index));
        }

        const raw = match[0];
        if (raw.startsWith('`') && raw.endsWith('`')) {
          parts.push(
            <code key={key++} className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 text-sky-900 font-mono text-xs font-semibold border border-slate-200">
              {raw.slice(1, -1)}
            </code>
          );
        } else if (raw.startsWith('**') && raw.endsWith('**')) {
          parts.push(
            <strong key={key++} className="font-semibold text-slate-900">
              {raw.slice(2, -2)}
            </strong>
          );
        } else if (raw.startsWith('*') && raw.endsWith('*')) {
          parts.push(
            <em key={key++} className="italic text-slate-800">
              {raw.slice(1, -1)}
            </em>
          );
        }

        lastIndex = inlineRegex.lastIndex;
      }

      if (lastIndex < current.length) {
        parts.push(current.substring(lastIndex));
      }

      return parts.length > 0 ? parts : str;
    };

    while (i < lines.length) {
      const line = lines[i];

      // Code Block ```
      if (line.trim().startsWith('```')) {
        const lang = line.trim().slice(3);
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        blocks.push(
          <div key={`code-${i}`} className="my-3 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 text-slate-100 text-xs shadow-sm">
            {lang && (
              <div className="px-3 py-1 bg-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-700">
                {lang}
              </div>
            )}
            <pre className="p-3 overflow-x-auto font-mono text-xs leading-relaxed">
              <code>{codeLines.join('\n')}</code>
            </pre>
          </div>
        );
        continue;
      }

      // Markdown Table (| ... | ... |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const headerRow = tableLines[0]
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim());
          // Check if second line is separator like |---|---|
          const hasSeparator = tableLines[1].includes('---');
          const dataRows = (hasSeparator ? tableLines.slice(2) : tableLines.slice(1)).map((row) =>
            row
              .split('|')
              .slice(1, -1)
              .map((c) => c.trim())
          );

          blocks.push(
            <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[340px]">
                <thead className="bg-sky-50/70 border-b border-sky-100 text-slate-800 font-semibold">
                  <tr>
                    {headerRow.map((th, thIdx) => (
                      <th key={thIdx} className="px-3 py-2.5 font-semibold text-slate-800 border-r last:border-r-0 border-slate-200">
                        {renderInline(th)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dataRows.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-slate-700 border-r last:border-r-0 border-slate-100 align-top">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Headings
      if (line.startsWith('### ')) {
        blocks.push(
          <h4 key={`h4-${i}`} className="text-base font-bold text-slate-900 mt-4 mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-4 bg-sky-500 rounded-full inline-block" />
            {renderInline(line.slice(4))}
          </h4>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        blocks.push(
          <h3 key={`h3-${i}`} className="text-lg font-bold text-slate-900 mt-5 mb-2 pb-1 border-b border-slate-100 flex items-center gap-2">
            <span className="w-2 h-4.5 bg-blue-600 rounded-full inline-block" />
            {renderInline(line.slice(3))}
          </h3>
        );
        i++;
        continue;
      }
      if (line.startsWith('# ')) {
        blocks.push(
          <h2 key={`h2-${i}`} className="text-xl font-extrabold text-slate-900 mt-6 mb-2 text-blue-950">
            {renderInline(line.slice(2))}
          </h2>
        );
        i++;
        continue;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        blocks.push(
          <blockquote key={`quote-${i}`} className="my-2.5 pl-3.5 py-1.5 border-l-3 border-sky-500 bg-sky-50/60 rounded-r-md text-slate-700 text-sm italic">
            {renderInline(line.slice(2))}
          </blockquote>
        );
        i++;
        continue;
      }

      // Horizontal Rule
      if (line.trim() === '---' || line.trim() === '***') {
        blocks.push(<hr key={`hr-${i}`} className="my-4 border-slate-200" />);
        i++;
        continue;
      }

      // Unordered List Items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const listItems: string[] = [];
        while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
          listItems.push(lines[i].trim().slice(2));
          i++;
        }
        blocks.push(
          <ul key={`ul-${i}`} className="my-2.5 space-y-1.5 pl-2">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600 mt-2 shrink-0" />
                <span className="flex-1">{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Ordered List Items (1. 2. ...)
      if (/^\d+\.\s/.test(line.trim())) {
        const listItems: { num: string; text: string }[] = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
          const match = lines[i].trim().match(/^(\d+)\.\s(.*)$/);
          if (match) {
            listItems.push({ num: match[1], text: match[2] });
          }
          i++;
        }
        blocks.push(
          <ol key={`ol-${i}`} className="my-2.5 space-y-1.5 pl-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-xs text-sky-800 bg-sky-100 rounded px-1.5 py-0.5 mt-0.5 shrink-0 min-w-5 text-center">
                  {item.num}
                </span>
                <span className="flex-1">{renderInline(item.text)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Empty line
      if (!line.trim()) {
        i++;
        continue;
      }

      // Regular Paragraph
      blocks.push(
        <p key={`p-${i}`} className="my-2 text-sm leading-relaxed text-slate-700">
          {renderInline(line)}
        </p>
      );
      i++;
    }

    return blocks;
  };

  return <div className={`space-y-1 prose-custom ${className}`}>{parseBlocks(content)}</div>;
};
