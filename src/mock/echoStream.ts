/**
 * 流式回显模拟：纯浏览器内实现（无任何后端/网络）。
 * 逐字输出用户输入内容，支持 AbortSignal 中止（模拟"停止生成"）。
 */
export interface EchoStreamOptions {
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function echoStream(
  text: string,
  options: EchoStreamOptions = {}
): Promise<void> {
  const { signal, onToken } = options;
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  // 模拟"思考"延迟
  await delay(420);

  for (const ch of text) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    onToken?.(ch);
    // 每字符 10~28ms，模拟打字节奏
    await delay(10 + Math.random() * 18);
  }
}
