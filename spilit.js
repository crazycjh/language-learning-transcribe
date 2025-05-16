import { encode } from 'gpt-3-encoder';

/**
 * 依據 token 限制切割逐字稿
 * @param {string} text - 原始逐字稿
 * @param {number} maxTokens - 每段最大 token 數，例如 1800
 * @returns {Array} 分段後的文字段落陣列
 */
export function splitTranscriptByTokenLimit(text, maxTokens = 1800) {
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(Boolean);

  const chunks = [];
  let currentChunk = '';
  let currentTokenCount = 0;

  for (const sentence of sentences) {
    const tokenCount = encode(sentence).length;

    if (currentTokenCount + tokenCount > maxTokens) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence + ' ';
      currentTokenCount = tokenCount;
    } else {
      currentChunk += sentence + ' ';
      currentTokenCount += tokenCount;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
