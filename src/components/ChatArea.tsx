import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import type * as React from 'react';
import type { Conversation } from '../types';
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
const CONTENT_EXIT_MS = 150;
const NEW_CONVERSATION_KEY = '__new_conversation__';

interface ChatAreaProps {
  /** 悬浮输入框根元素：滚动条轨道、"回到底部"按钮与底部留白均止于输入框上方 */
  inputAreaRef: RefObject<HTMLDivElement | null>;
}

interface InputLayout {
  /** 输入框本体（box）顶部距聊天区底部的距离 */
  boxTop: number;
  /** 渐变区高度（box 上方透明→白色区域） */
  gradH: number;
  /** 消息底部留白 */
  pb: number;
}

export function ChatArea({ inputAreaRef }: ChatAreaProps) {
  const { state } = useChat();
  const { showMenu } = useContextMenu();
  const { push } = useToast();

  const desiredKey = state.activeId ?? NEW_CONVERSATION_KEY;
  const [displayKey, setDisplayKey] = useState(desiredKey);
  const [contentExiting, setContentExiting] = useState(false);
  const convSnapshotRef = useRef<Conversation | null>(null);
  const liveDisplayConv =
    displayKey === NEW_CONVERSATION_KEY
      ? null
      : state.conversations.find((c) => c.id === displayKey) ?? null;
  if (liveDisplayConv) convSnapshotRef.current = liveDisplayConv;
  const conv = liveDisplayConv ?? convSnapshotRef.current;
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);
  const bottomPadRef = useRef(0);
  const [showJump, setShowJump] = useState(false);
  const [layout, setLayout] = useState<InputLayout>({ boxTop: 0, gradH: 0, pb: 80 });

  const lastMsg = conv ? conv.messages[conv.messages.length - 1] : null;
  const lastContentLen = lastMsg?.content.length ?? 0;

  // 新建/切换会话时先让当前内容退场，再挂载目标内容。
  useEffect(() => {
    if (desiredKey === displayKey) return;
    setContentExiting(true);
    const timer = window.setTimeout(() => {
      if (desiredKey === NEW_CONVERSATION_KEY) {
        convSnapshotRef.current = null;
      }
      setDisplayKey(desiredKey);
      setContentExiting(false);
    }, CONTENT_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [desiredKey, displayKey]);

  // 以输入框本体（box）为基准计算布局：
  // 滚动条轨道止于 box 上方 6px、"回到底部"按钮 12px、消息留白 = box + 渐变 + 6px
  const computeLayout = (): InputLayout | null => {
    const input = inputAreaRef.current; // .box 元素
    const parent = input?.parentElement; // .inputArea 元素
    if (!input || !parent) return null;
    const boxTop = parent.offsetHeight - input.offsetTop;
    const gradH = parent.offsetHeight - input.offsetTop - input.offsetHeight;
    const pb = Math.max(60, boxTop + gradH + 6);
    return { boxTop, gradH, pb };
  };

  const applyPadding = (scroller: HTMLDivElement) => {
    const l = computeLayout();
    if (!l) return;
    scroller.style.paddingBottom = `${l.pb}px`;
    bottomPadRef.current = l.pb;
  };

  // 实时测量输入框（textarea 增高时联动）
  useEffect(() => {
    const input = inputAreaRef.current;
    if (!input) return;
    const update = () => {
      const l = computeLayout();
      if (!l) return;
      setLayout(l);
      const scroller = scrollerRef.current;
      if (scroller) applyPadding(scroller);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(input);
    return () => ro.disconnect();
  }, [inputAreaRef]);

  // 切换会话：直接到底部
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    applyPadding(el);
    el.scrollTop = el.scrollHeight;
    isAtBottomRef.current = true;
    setShowJump(false);
  }, [displayKey]);

  // 智能跟随：仅在用户停留在底部时自动滚动（流式输出/新消息）
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    applyPadding(el);
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

  const isEmpty = !conv || conv.messages.length === 0;

  return (
    <div className={styles.chat} onContextMenu={onContextMenu}>
      <div
        key={displayKey}
        className={`${styles.contentLayer} ${contentExiting ? styles.exiting : ''}`}
      >
        {isEmpty ? (
          <WelcomeEmpty />
        ) : (
          <div
            ref={scrollerRef}
            className={styles.scroller}
            onScroll={onScroll}
          >
            <div className={styles.messages}>
              {conv.messages.map((m) => (
                <MessageItem key={m.id} message={m} />
              ))}
            </div>
          </div>
        )}
      </div>
      {!isEmpty && (
        <ScrollbarTrack
          containerRef={scrollerRef}
          bottomOffset={layout.boxTop + 6}
        />
      )}
      {!isEmpty && (
        <button
          type="button"
          className={`${styles.jump} ${showJump ? styles.visible : ''}`}
          style={{ bottom: layout.boxTop + 12 }}
          onClick={jumpToBottom}
          title="回到底部"
          aria-label="回到底部"
          tabIndex={showJump ? 0 : -1}
        >
          <Icon name="arrowDown" size={15} />
        </button>
      )}
    </div>
  );
}
