
import { ResponseLength, ScenarioType } from '../types';

export const formatMessage = (text: string) => {
  if (!text) return "";
  
  let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formattedText = formattedText.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formattedText = formattedText.replace(/_(.*?)_/g, '<em>$1</em>');
  
  formattedText = formattedText.replace(/\n/g, '<br/>');
  
  return formattedText;
};

export const getCurrentScenario = (
  scenarioTypes: ScenarioType[],
  activeScenario: string
): ScenarioType => {
  return scenarioTypes.find(s => s.id === activeScenario) || scenarioTypes[0];
};

export const getCurrentPrompt = (
  promptInputs: {[key: string]: string},
  activeScenario: string
): string => {
  return promptInputs[activeScenario] || '';
};

export const getModelDisplayName = (modelId: string, availableModels: any[]): string => {
  const model = availableModels.find(m => m.id === modelId);
  return model ? model.name : modelId.split('/').pop() || modelId;
};

export const parseMarkdown = (markdown: string) => {
  if (!markdown) return '';
  
  // Parse headings
  let parsed = markdown
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');
  
  // Parse lists
  parsed = parsed.replace(/^\s*\d+\.\s(.+)/gim, '<li class="ml-5 list-decimal">$1</li>');
  parsed = parsed.replace(/^\s*[\-\*]\s(.+)/gim, '<li class="ml-5 list-disc">$1</li>');
  
  // Group consecutive list items
  parsed = parsed
    .replace(/<\/li>\n<li class="ml-5 list-disc">/g, '</li><li class="ml-5 list-disc">')
    .replace(/<\/li>\n<li class="ml-5 list-decimal">/g, '</li><li class="ml-5 list-decimal">');
  
  // Wrap list groups with proper list tags
  parsed = parsed.replace(/<li class="ml-5 list-disc">(.+?)(<\/li>)(?!\n<li class="ml-5 list-disc">)/gs, '<ul class="list-disc ml-5 my-3">$&</ul>');
  parsed = parsed.replace(/<li class="ml-5 list-decimal">(.+?)(<\/li>)(?!\n<li class="ml-5 list-decimal">)/gs, '<ol class="list-decimal ml-5 my-3">$&</ol>');
  
  // Parse paragraph breaks
  parsed = parsed.replace(/\n\s*\n/g, '<br/><br/>');
  
  // Parse bold and italics
  parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Parse inline code
  parsed = parsed.replace(/`(.*?)`/g, '<code class="bg-gray-100 text-purple-600 px-1 rounded">$1</code>');
  
  // Parse code blocks
  parsed = parsed.replace(/```(.*?)\n([\s\S]*?)\n```/g, 
    '<pre class="bg-gray-100 p-3 rounded-md my-3 overflow-x-auto"><code>$2</code></pre>');
  
  return parsed;
};
