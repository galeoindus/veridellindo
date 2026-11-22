/** Optional direct-to-device Ollama client. No cloud proxy and no API key.
 * The fixed loopback origin prevents an imported settings value from sending
 * prompts or images to an arbitrary remote host.
 */
export const OLLAMA_ORIGIN = 'http://127.0.0.1:11434';
export const DEFAULT_OLLAMA_MODEL = 'qwen2.5:1.5b';

async function request(url, options = {}) {
  let response;
  try {
    response = await fetch(url, { mode: 'cors', credentials: 'omit', ...options });
  } catch {
    throw new Error('Local Ollama could not be reached. Start Ollama, allow this site in OLLAMA_ORIGINS, and try Connect again.');
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const error = new Error(`Ollama returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ''}`);
    error.status = response.status;
    throw error;
  }
  return response;
}

export function toOllamaImage(dataUrl) {
  const value = String(dataUrl || '');
  const match = value.match(/^data:image\/(?:png|jpe?g|webp);base64,([a-z\d+/=]+)$/i);
  return match ? match[1] : '';
}
