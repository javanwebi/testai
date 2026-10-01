import React from 'react';

/**
 * Parses and renders rich engineering consultant text including:
 * - Markdown tables (| ... |)
 * - Industrial standard badges (DIN, ISO, HTD, SPZ, SPA, SPB, SPC)
 * - Formulas and mathematical calculations
 * - Bold headings (###, ##) and bullet lists
 */
export function renderEngineeringMarkdown(text: string, isDarkTheme = false): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let tableBuffer: string[] = [];
  let inTable = false;

  const flushTable = (keyPrefix: string) => {
    if (tableBuffer.length < 2) {
      // Not a real table
      tableBuffer.forEach((tblLine, idx) => {
        elements.push(
          <p key={`${keyPrefix}-raw-${idx}`} className="my-1 text-sm leading-relaxed">
            {formatInlineText(tblLine, isDarkTheme)}
          </p>
        );
      });
      tableBuffer = [];
      inTable = false;
      return;
    }

    const headerLine = tableBuffer[0];
    const dataLines = tableBuffer.slice(2); // Skip separator line (|---|---|)

    const parseRow = (line: string) =>
      line
        .split('|')
        .slice(1, -1)
        .map(cell => cell.trim());

    const headers = parseRow(headerLine);
    const rows = dataLines.map(parseRow);

    elements.push(
      <div
        key={`${keyPrefix}-tbl`}
        className={`my-3 overflow-x-auto rounded-xl border shadow-sm ${
          isDarkTheme ? 'border-slate-700 bg-slate-900/80' : 'border-[#CBD2D8] bg-slate-50'
        }`}
        dir="rtl"
      >
        <table className="w-full text-right text-xs border-collapse">
          <thead>
            <tr className={isDarkTheme ? 'bg-slate-800 text-orange-400 border-b border-slate-700' : 'bg-[#2B313A] text-white border-b border-slate-300'}>
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 font-black tracking-wide text-xs">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkTheme ? 'divide-slate-800 text-slate-200' : 'divide-slate-200 text-[#2B313A]'}`}>
            {rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className={
                  rIdx % 2 === 0
                    ? isDarkTheme
                      ? 'bg-slate-900/40 hover:bg-slate-800/50'
                      : 'bg-white hover:bg-orange-50/50'
                    : isDarkTheme
                    ? 'bg-slate-900/80 hover:bg-slate-800/50'
                    : 'bg-slate-50/60 hover:bg-orange-50/50'
                }
              >
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-xs font-medium">
                    {formatInlineText(cell, isDarkTheme)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    tableBuffer = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for markdown table row
    if (line.startsWith('|') && line.endsWith('|')) {
      inTable = true;
      tableBuffer.push(line);
      continue;
    } else if (inTable) {
      flushTable(`table-${i}`);
    }

    if (!line) {
      elements.push(<div key={`spacer-${i}`} className="h-2" />);
      continue;
    }

    // Headings
    if (line.startsWith('###')) {
      elements.push(
        <h4
          key={`h3-${i}`}
          className={`font-black text-sm sm:text-base mt-3 mb-1.5 flex items-center gap-1.5 ${
            isDarkTheme ? 'text-orange-400' : 'text-[#E06518]'
          }`}
        >
          <span className="w-1.5 h-3.5 bg-[#E06518] rounded-full inline-block" />
          {formatInlineText(line.replace(/^###\s*/, ''), isDarkTheme)}
        </h4>
      );
      continue;
    }

    if (line.startsWith('##')) {
      elements.push(
        <h3
          key={`h2-${i}`}
          className={`font-black text-base sm:text-lg mt-3.5 mb-2 ${
            isDarkTheme ? 'text-white' : 'text-[#2B313A]'
          }`}
        >
          {formatInlineText(line.replace(/^##\s*/, ''), isDarkTheme)}
        </h3>
      );
      continue;
    }

    // Bullet points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2 my-1 pr-2 text-xs sm:text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E06518] mt-2 shrink-0" />
          <span className="leading-relaxed">
            {formatInlineText(line.replace(/^[-*]\s*/, ''), isDarkTheme)}
          </span>
        </div>
      );
      continue;
    }

    // Numbered list (1. 2. 3.)
    const numMatch = line.match(/^(\d+)[.)]\s*(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 my-1 pr-1 text-xs sm:text-sm">
          <span
            className={`font-black text-xs px-1.5 py-0.5 rounded-md shrink-0 mt-0.5 ${
              isDarkTheme ? 'bg-orange-950/80 text-orange-300' : 'bg-orange-100 text-[#E06518]'
            }`}
          >
            {numMatch[1]}
          </span>
          <span className="leading-relaxed">{formatInlineText(numMatch[2], isDarkTheme)}</span>
        </div>
      );
      continue;
    }

    // Formulas or calculation blocks
    if (line.startsWith('$$') || line.includes('L_p') || line.includes('approx') || line.includes('\\frac')) {
      elements.push(
        <div
          key={`formula-${i}`}
          className={`my-2 px-3 py-2 rounded-xl font-mono text-xs sm:text-sm text-center border shadow-xs ${
            isDarkTheme
              ? 'bg-slate-950/80 border-slate-700 text-amber-300'
              : 'bg-orange-50/70 border-orange-200 text-[#2B313A]'
          }`}
          dir="ltr"
        >
          {line.replace(/\$\$/g, '')}
        </div>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="my-1.5 text-xs sm:text-sm leading-relaxed">
        {formatInlineText(line, isDarkTheme)}
      </p>
    );
  }

  if (inTable) {
    flushTable('table-end');
  }

  return <div className="space-y-1">{elements}</div>;
}

/**
 * Highlights bold text, standards (DIN, ISO, HTD, etc.), and codes
 */
function formatInlineText(text: string, isDarkTheme: boolean): React.ReactNode {
  if (!text) return '';

  // Process bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldContent = part.slice(2, -2);
      // Check if it's an industrial standard code
      const isStandardCode = /DIN|ISO|HTD|SPZ|SPA|SPB|SPC|PK|PJ|SWR|FORZA/i.test(boldContent);

      return (
        <strong
          key={idx}
          className={`font-black ${
            isStandardCode
              ? isDarkTheme
                ? 'text-orange-400 bg-orange-950/50 px-1 py-0.5 rounded'
                : 'text-[#E06518] bg-orange-50 px-1 py-0.5 rounded'
              : isDarkTheme
              ? 'text-white'
              : 'text-[#2B313A]'
          }`}
        >
          {boldContent}
        </strong>
      );
    }

    // Highlight standalone standards like DIN 2215, ISO 4184, HTD 8M, etc.
    const stdRegex = /\b(DIN\s*\d+|ISO\s*\d+|HTD\s*\d*[M]?|SPZ|SPA|SPB|SPC|8M|14M|5M|3M|PK|PJ|SWR|FORZA)\b/gi;
    if (stdRegex.test(part)) {
      const subParts = part.split(stdRegex);
      return subParts.map((sub, sIdx) => {
        if (stdRegex.test(sub)) {
          return (
            <span
              key={`${idx}-${sIdx}`}
              className={`font-bold font-mono text-[11px] px-1 py-0.2 rounded border mx-0.5 ${
                isDarkTheme
                  ? 'border-orange-500/40 bg-orange-950/40 text-orange-300'
                  : 'border-orange-300 bg-orange-50 text-[#E06518]'
              }`}
            >
              {sub}
            </span>
          );
        }
        return sub;
      });
    }

    return part;
  });
}
