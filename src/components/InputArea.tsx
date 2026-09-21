import { forwardRef, useEffect, useRef } from 'react';
import type * as React from 'react';
import { useChat } from '../store/ChatStore';
import { ScrollbarTrack } from './ScrollbarTrack';
import { Icon } from './Icon';
import styles from './InputArea.module.css';

const MAX_INPUT_HEIGHT = 160;

export const InputArea = forwardRef<HTMLDivElement>(function InputArea(_props, ref) {
  const { state, send, stop, setDraft } = useChat();

  const conv = state.conversations.find((c) => c.id === state.activeId) ?? null;
  const value = conv ? (state.drafts[conv.id] ?? '') : '';
  const isStreaming =
    state.streamingId !== null && state.streamingId === state.activeId;
  const canSend = value.trim().length > 0 && !isStreaming;

  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // 自动增高
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [value]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 中文输入法组词确认（Enter）时不发送
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canSend) send(value);
    }
  };

  return (
    <div className={styles.inputArea}>
      {/* ref 挂在 box 上：聊天区据此让滚动条/按钮/留白紧贴输入框本体 */}
      <div ref={ref} className={styles.box}>
        <div className={styles.taWrap}>
          <textarea
            ref={taRef}
            value={value}
            rows={1}
            placeholder="和 SidePane AI 聊聊…"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <ScrollbarTrack containerRef={taRef} deps={[value.length]} />
        </div>
        <div className={styles.toolbar}>
          {isStreaming ? (
            <button
              type="button"
              className={`${styles.sendBtn} ${styles.stopBtn}`}
              onClick={stop}
              title="停止生成"
              aria-label="停止生成"
            >
              <Icon name="stop" size={14} />
            </button>
          ) : (
            <button
              type="button"
              className={styles.sendBtn}
              disabled={!canSend}
              onClick={() => send(value)}
              title="发送"
              aria-label="发送"
            >
              <Icon name="send" size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
