/** 生成简易唯一 id */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** 截取首句作为会话标题（AI 自动命名，UI 阶段简化实现） */
export function truncateTitle(text: string, max = 20): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '未命名对话';
  if (clean.length <= max) return clean;
  return clean.slice(0, max) + '…';
}
