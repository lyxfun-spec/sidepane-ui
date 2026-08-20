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
  createdAt: number;
  updatedAt: number;
}
