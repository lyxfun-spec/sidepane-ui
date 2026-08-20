import { useEffect, useMemo } from 'react';
import type * as React from 'react';
import type { Conversation } from '../types';
import { useChat } from '../store/ChatStore';
import { useContextMenu } from './ContextMenu';
import { useModal } from './Modal';
import { useToast } from './Toast';
import { Icon } from './Icon';
import styles from './ConversationPanel.module.css';

interface ConversationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ConversationPanel({ open, onClose }: ConversationPanelProps) {
  const {
    state,
    switchConversation,
    renameConversation,
    deleteConversation,
    togglePin,
    setMarkColor,
  } = useChat();
  const { showMenu } = useContextMenu();
  const { confirm, prompt } = useModal();
  const { push } = useToast();

  const { pinned, normal } = useMemo(() => {
    const list = [...state.conversations].sort((a, b) => b.updatedAt - a.updatedAt);
    return {
      pinned: list.filter((c) => c.pinned),
      normal: list.filter((c) => !c.pinned),
    };
  }, [state.conversations]);

  // Esc 关闭面板
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const openRowMenu = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    showMenu(e.clientX, e.clientY, [
      {
        label: '重命名',
        onClick: () =>
          prompt({
            title: '重命名对话',
            initial: conv.title,
            maxLength: 30,
            onConfirm: (v) => renameConversation(conv.id, v),
          }),
      },
      {
        label: conv.pinned ? '取消置顶' : '置顶',
        onClick: () => togglePin(conv.id),
      },
      {
        label: '标记',
        onMarkPick: (color) => setMarkColor(conv.id, color),
      },
      {
        label: '删除',
        danger: true,
        onClick: () =>
          confirm({
            title: '删除对话',
            message: `确定删除对话“${conv.title}”吗？删除后无法恢复。`,
            confirmText: '删除',
            danger: true,
            onConfirm: () => {
              deleteConversation(conv.id);
              push('对话已删除', 'success');
            },
          }),
      },
    ]);
  };

  const renderGroup = (items: Conversation[]) =>
    items.map((conv) => {
      const isStreaming = state.streamingId === conv.id;
      const isActive = state.activeId === conv.id;
      return (
        <div
          key={conv.id}
          className={`${styles.row} ${isActive ? styles.active : ''} ${isStreaming ? styles.streaming : ''}`}
          onClick={() => {
            switchConversation(conv.id);
            onClose();
          }}
        >
          {conv.markColor && (
            <span className={styles.dot} style={{ background: conv.markColor }} />
          )}
          <span
            className={styles.title}
            style={conv.markColor ? { color: conv.markColor } : undefined}
            title={conv.title}
          >
            {conv.title}
          </span>
          {isStreaming && <span className={styles.spinner} title="正在生成" />}
          <button
            type="button"
            className={styles.more}
            title="更多"
            aria-label="更多操作"
            onClick={(e) => openRowMenu(e, conv)}
          >
            <Icon name="dots" size={15} />
          </button>
        </div>
      );
    });

  return (
    <>
      <div
        className={`${styles.overlay} ${open ? styles.open : ''}`}
        onClick={onClose}
      />
      <aside className={`${styles.panel} ${open ? styles.open : ''}`}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>对话列表</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title="关闭"
            aria-label="关闭会话列表"
          >
            <Icon name="close" size={15} />
          </button>
        </div>
        <div className={styles.list}>
          {state.conversations.length === 0 ? (
            <div className={styles.empty}>暂无对话</div>
          ) : (
            <>
              {renderGroup(pinned)}
              {pinned.length > 0 && normal.length > 0 && (
                <div className={styles.divider} />
              )}
              {renderGroup(normal)}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
