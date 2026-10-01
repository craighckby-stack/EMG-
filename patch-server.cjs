const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const search = `CRITICAL Requirements:
1. Optimize, modernize, and enhance this \${isMarkdown ? 'markdown document' : 'source code'} strictly according to the goal.
2. \${
  isMarkdown
    ? 'Preserve all essential links, factual information, and document structure while improving clarity, formatting, and completeness.'
    : 'Maintain all business logic, export names, function signatures, and external API contracts intact. Ensure all brackets, braces, parentheses, quotes, and language syntax are 100% syntactically valid and balanced.'
}
3. \${
  isMarkdown
    ? 'Output the complete optimized markdown between @@@START and @@@END.'
    : 'Output raw executable source code ONLY between delimiters @@@START and @@@END. Do NOT include markdown code fences (like \`\`\`javascript) inside @@@START and @@@END. Do NOT output conversational or introductory text.'
}
4. Output a 1-sentence summary of enhancements immediately after @@@SUMMARY:
\`;`;

const replace = `CRITICAL Requirements:
1. Optimize, modernize, and enhance this \${isMarkdown ? 'markdown document' : 'source code'} strictly according to the goal.
2. \${
  isMarkdown
    ? 'Preserve all essential links, factual information, and document structure while improving clarity, formatting, and completeness.'
    : 'Maintain all business logic, export names, function signatures, and external API contracts intact. Ensure all brackets, braces, parentheses, quotes, and language syntax are 100% syntactically valid and balanced.'
}
3. Do NOT rewrite the entire file. Generate a strict Unified Diff format containing ONLY your changes.
4. Output the unified diff ONLY between delimiters @@@START and @@@END. Do NOT include markdown code fences (like \`\`\`diff) inside the delimiters. Do NOT output conversational text.
5. Output a 1-sentence summary of enhancements immediately after @@@SUMMARY:
\`;`;

content = content.replace(search, replace);
fs.writeFileSync('server.ts', content);
console.log('patched server.ts');
