// Pure check that a model answer is real text (no Deno imports; unit-tested).

/**
 * Text with tool-call markup removed; null when fewer than `minWords` real
 * words are left. Some models leak tool calls (<tool_call>, [TOOL_CALLS],
 * <invoke>/<parameter>, ｜DSML｜ markers) instead of answering.
 */
export function cleanAnalysis(text: string, minWords = 60): string | null {
  const cleaned = (text || "")
    .replace(/<\|?(tool_call|tool_calls|function_call|im_start|im_end|python_tag)[^>]*>[\s\S]*?(<\/?\|?\1[^>]*>|$)/gi, "")
    .replace(/<\/?\|?(tool_call|tool_calls|function_call|tool_response|im_start|im_end)\|?>/gi, "")
    .replace(/\[TOOL_CALLS\][\s\S]*$/g, "")
    .replace(/<\/?[^<>\n]{0,24}?(invoke|parameter|function_calls|tool_calls|calls|dsml)\b[^>]*>/gi, "")
    .replace(/[｜|]\s*DSML\s*[｜|]/gi, "")
    .replace(/\{\s*"name"\s*:\s*"[\w.-]+"\s*,\s*"(arguments|parameters)"\s*:[\s\S]*?\}\s*\}/g, "")
    .trim();
  const words = cleaned.split(/\s+/).filter((w) => /[a-zåäö]{2,}/i.test(w)).length;
  return words >= minWords ? cleaned : null;
}
