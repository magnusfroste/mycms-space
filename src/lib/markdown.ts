export const parseMarkdown = (text: string) => {
  if (!text) return '';
  
  // Split into lines
  const lines = text.split('\n');
  const output: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Empty line = line break
    if (!trimmed) {
      output.push('<br />');
      continue;
    }
    
    // Numbered list: "1. Text"
    if (/^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s+/, '');
      output.push(`<div class="ml-4 my-1">• ${formatInline(content)}</div>`);
      continue;
    }
    
    // Bullet list: "- Text" or "* Text"
    if (/^[-*]\s/.test(trimmed)) {
      const content = trimmed.replace(/^[-*]\s+/, '');
      output.push(`<div class="ml-4 my-1">• ${formatInline(content)}</div>`);
      continue;
    }
    
    // Regular paragraph
    output.push(`<div class="my-1">${formatInline(trimmed)}</div>`);
  }
  
  return output.join('\n');
};

// Handle bold only
function formatInline(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
