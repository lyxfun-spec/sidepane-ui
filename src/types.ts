export type Role = 'user' | 'assistant';

export type MessageStatus = 'streaming' | 'done' | 'stopped';

export interface ChatMessage {
  id: string;
  role: Role;
  /** assistant 消息为 Markdown 原文；user 消息为纯文本 */
  content: string;
  status: MessageStatus;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  pinned: boolean;
  /** 标记色（hex），null 表示无标记 */
  markColor: string | null;
  createdAt: number;
  updatedAt: number;
}

/** 会话标记可选颜色（Fluent 语义色） */
export const MARK_COLORS: readonly string[] = [
  '#c50f1f',
  '#c19c00',
  '#0f7b0f',
  '#0067c0',
  '#744da9',
  '#b4009e',
];
