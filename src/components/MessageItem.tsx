import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../types';
import { copyText } from '../utils/clipboard';
import { useToast } from './Toast';
import { MarkdownView } from './MarkdownView';
import { Icon } from './Icon';
import styles from './MessageItem.module.css';

export function MessageItem({ message }: { message: ChatMessage }) {
  const { push } = useToast();
  const isStreaming = message.status === 'streaming';
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
    },
    []
  );

  const handleCopy = () => {
    copyText(message.content);
    setCopied(true);
    if (copiedTimerRef.current !== null) {
      window.clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = window.setTimeout(() => setCopied(false), 1400);
    push('已复制到剪贴板', 'success');
  };

  if (message.role === 'user') {
    return (
      <div className={`${styles.wrapper} ${styles.user}`}>
        <div className={styles.userBubble}>{message.content}</div>
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} ${styles.ai}`}>
      <div className={styles.aiBody}>
        {message.content ? (
          <MarkdownView content={message.content} />
        ) : (
          <span className={styles.placeholder}>
            正在思考
            <span className={styles.thinkingDots} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </span>
        )}
        {isStreaming && <span className={styles.caret} />}
        <div className={styles.footer}>
          {message.status === 'stopped' && (
            <span className={styles.stoppedTag}>已停止</span>
          )}
          {!isStreaming && (
            <button
              type="button"
              className={styles.copyBtn}
              onClick={handleCopy}
              title="复制内容（原始 Markdown）"
              aria-label="复制内容"
            >
              <Icon name={copied ? 'check' : 'copy'} size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
