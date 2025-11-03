export const parseMarkdown = (markdown: string) => {
  if (!markdown) return '';
  
  // First, strip any existing HTML tags to start clean
  let text = markdown
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .trim();
  
  // Track code blocks to prevent processing markdown inside them
  const codeBlocks: { placeholder: string; content: string }[] = [];
  let codeBlockIndex = 0;
  
  // Extract and protect code blocks first
  text = text.replace(/```(.*?)\n([\s\S]*?)```/g, (match, lang, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlockIndex}__`;
    codeBlocks.push({
      placeholder,
      content: `<pre class="bg-muted/50 dark:bg-muted p-3 rounded-md my-3 overflow-x-auto border border-border"><code class="text-sm">${escapeHtml(code.trim())}</code></pre>`
    });
    codeBlockIndex++;
    return placeholder;
  });
  
  // Extract and protect inline code
  const inlineCodes: { placeholder: string; content: string }[] = [];
  let inlineCodeIndex = 0;
  text = text.replace(/`([^`]+)`/g, (match, code) => {
    const placeholder = `__INLINE_CODE_${inlineCodeIndex}__`;
    inlineCodes.push({
      placeholder,
      content: `<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">${escapeHtml(code)}</code>`
    });
    inlineCodeIndex++;
    return placeholder;
  });
  
  // Split into lines for processing
  const lines = text.split('\n');
  const output: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Skip empty lines but close lists
    if (!line.trim()) {
      if (inList) {
        output.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = false;
        listType = null;
      }
      output.push('<br />');
      continue;
    }
    
    // Headings (must be at start of line)
    if (line.match(/^### /)) {
      if (inList) {
        output.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = false;
        listType = null;
      }
      output.push(`<h3 class="text-lg font-semibold mt-4 mb-2">${processInline(line.substring(4))}</h3>`);
      continue;
    }
    if (line.match(/^## /)) {
      if (inList) {
        output.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = false;
        listType = null;
      }
      output.push(`<h2 class="text-xl font-bold mt-5 mb-3">${processInline(line.substring(3))}</h2>`);
      continue;
    }
    if (line.match(/^# /)) {
      if (inList) {
        output.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = false;
        listType = null;
      }
      output.push(`<h1 class="text-2xl font-bold mt-6 mb-4">${processInline(line.substring(2))}</h1>`);
      continue;
    }
    
    // Horizontal rules
    if (line.match(/^[-*_]{3,}$/)) {
      if (inList) {
        output.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = false;
        listType = null;
      }
      output.push('<hr class="my-4 border-border" />');
      continue;
    }
    
    // Blockquotes
    if (line.match(/^>\s/)) {
      if (inList) {
        output.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = false;
        listType = null;
      }
      output.push(`<blockquote class="pl-4 border-l-4 border-border italic text-muted-foreground my-2">${processInline(line.substring(2))}</blockquote>`);
      continue;
    }
    
    // Ordered lists
    const olMatch = line.match(/^\s*(\d+)\.\s+(.+)/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) output.push('</ul>');
        output.push('<ol class="list-decimal ml-6 my-2 space-y-1">');
        inList = true;
        listType = 'ol';
      }
      output.push(`<li class="text-sm">${processInline(olMatch[2])}</li>`);
      continue;
    }
    
    // Unordered lists
    const ulMatch = line.match(/^\s*[-*+]\s+(.+)/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) output.push('</ol>');
        output.push('<ul class="list-disc ml-6 my-2 space-y-1">');
        inList = true;
        listType = 'ul';
      }
      output.push(`<li class="text-sm">${processInline(ulMatch[1])}</li>`);
      continue;
    }
    
    // Regular paragraph
    if (inList) {
      output.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
      listType = null;
    }
    output.push(`<p class="my-2 text-sm leading-relaxed">${processInline(line)}</p>`);
  }
  
  // Close any open list
  if (inList) {
    output.push(listType === 'ul' ? '</ul>' : '</ol>');
  }
  
  let result = output.join('\n');
  
  // Restore code blocks
  codeBlocks.forEach(({ placeholder, content }) => {
    result = result.replace(placeholder, content);
  });
  
  // Restore inline code
  inlineCodes.forEach(({ placeholder, content }) => {
    result = result.replace(placeholder, content);
  });
  
  return result;
};

// Helper function to process inline markdown (bold, italic, links)
function processInline(text: string): string {
  // Links (before bold/italic to avoid conflicts)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Bold (** or __)
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong class="font-semibold">$1</strong>');
  
  // Italic (* or _) - after bold to avoid conflicts
  text = text.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
  text = text.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');
  
  return text;
}

// Helper function to escape HTML entities
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
