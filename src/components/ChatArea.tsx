import { useCallback, useEffect, useRef, useState } from 'react';
import type * as React from 'react';
import { useChat } from '../store/ChatStore';
import { useContextMenu } from './ContextMenu';
import { useToast } from './Toast';
import { MessageItem } from './MessageItem';
import { WelcomeEmpty } from './WelcomeEmpty';
import { ScrollbarTrack } from './ScrollbarTrack';
import { copyText } from '../utils/clipboard';
import { Icon } from './Icon';
import styles from './ChatArea.module.css';

const AT_BOTTOM_MARGIN = 24;

export function ChatArea() {
  const { state } = useChat();
  const { showMenu } = useContextMenu();
  const { push } = useToast();

  const conv = state.conversations.find((c) => c.id === state.activeId) ?? null;
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);
  const bottomPadRef = useRef(0);
  const [showJump, setShowJump] = useState(false);

  const lastMsg = conv ? conv.messages[conv.messages.length - 1] : null;
  const lastContentLen = lastMsg?.content.length ?? 0;

  // 切换会话：直接到底部
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    bottomPadRef.current = parseFloat(getComputedStyle(el).paddingBottom) || 0;
    el.scrollTop = el.scrollHeight;
    isAtBottomRef.current = true;
    setShowJump(false);
  }, [state.activeId]);

  // 智能跟随：仅在用户停留在底部时自动滚动（流式输出/新消息）
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    bottomPadRef.current = parseFloat(getComputedStyle(el).paddingBottom) || 0;
    if (!isAtBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [conv?.messages.length, lastMsg?.status, lastContentLen]);

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // 底部判定需计入 padding-bottom（悬浮输入框占用区域），避免跟随滚动失效
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <
      bottomPadRef.current + AT_BOTTOM_MARGIN;
    isAtBottomRef.current = atBottom;
    setShowJump(!atBottom);
  }, []);

  const jumpToBottom = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    isAtBottomRef.current = true;
  }, []);

  // 选中文字右键菜单：复制 / 全选
  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      if (!scrollerRef.current?.contains(sel.anchorNode)) return;
      e.preventDefault();
      showMenu(e.clientX, e.clientY, [
        {
          label: '复制',
          onClick: () => {
            const text = sel.toString();
            if (text) {
              copyText(text);
              push('已复制到剪贴板', 'success');
            }
          },
        },
        {
          label: '全选',
          onClick: () => {
            const el = scrollerRef.current;
            if (!el) return;
            const range = document.createRange();
            range.selectNodeContents(el);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
          },
        },
      ]);
    },
    [showMenu, push]
  );

  if (!conv || conv.messages.length === 0) {
    return (
      <div className={styles.chat} onContextMenu={onContextMenu}>
        <WelcomeEmpty />
      </div>
    );
  }

  return (
    <div className={styles.chat}>
      <div
        ref={scrollerRef}
        className={styles.scroller}
        onScroll={onScroll}
        onContextMenu={onContextMenu}
      >
        <div className={styles.messages}>
          {conv.messages.map((m) => (
            <MessageItem key={m.id} message={m} />
          ))}
        </div>
      </div>
      <ScrollbarTrack containerRef={scrollerRef} />
      {showJump && (
        <button
          type="button"
          className={styles.jump}
          onClick={jumpToBottom}
          title="回到底部"
          aria-label="回到底部"
        >
          <Icon name="arrowDown" size={15} />
        </button>
      )}
    </div>
  );
}
