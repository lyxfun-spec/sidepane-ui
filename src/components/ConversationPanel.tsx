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
  const { state, switchConversation, renameConversation, deleteConversation } =
    useChat();
  const { showMenu } = useContextMenu();
  const { confirm, prompt } = useModal();
  const { push } = useToast();

  const sorted = useMemo(
    () => [...state.conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [state.conversations]
  );

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

  return (
    <>
      <div
        className={`${styles.overlay} ${open ? styles.open : ''}`}
        onClick={onClose}
      />
      <aside className={`${styles.panel} ${open ? styles.open : ''}`}>
        <div className={styles.list}>
          {sorted.length === 0 ? (
            <div className={styles.empty}>暂无对话</div>
          ) : (
            sorted.map((conv) => {
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
                  <span className={styles.title} title={conv.title}>
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
                    <Icon name="dots" size={24} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
