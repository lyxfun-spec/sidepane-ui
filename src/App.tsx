import { useRef, useState } from 'react';
import { ChatProvider, useChat } from './store/ChatStore';
import { ToastProvider } from './components/Toast';
import { ModalProvider } from './components/Modal';
import { ContextMenuProvider } from './components/ContextMenu';
import { TopBar } from './components/TopBar';
import { ConversationPanel } from './components/ConversationPanel';
import { ChatArea } from './components/ChatArea';
import { InputArea } from './components/InputArea';
import styles from './App.module.css';

function Shell() {
  const [panelOpen, setPanelOpen] = useState(false);
  const { newConversation } = useChat();
  // 悬浮输入框根元素：聊天区据此避开输入框区域（滚动条/回到底部按钮/底部留白）
  const inputAreaRef = useRef<HTMLDivElement | null>(null);
  const resizePointerRef = useRef<number | null>(null);
  const desktop = window.sidepaneDesktop;

  const finishResize = () => {
    if (resizePointerRef.current === null || !desktop) return;
    resizePointerRef.current = null;
    desktop.endResize();
  };

  return (
    <div className="app-shell">
      {desktop ? (
        <div
          className={styles.resizeHandle}
          aria-hidden="true"
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            resizePointerRef.current = event.pointerId;
            event.currentTarget.setPointerCapture(event.pointerId);
            desktop.beginResize();
            desktop.resizeTo(event.screenX);
          }}
          onPointerMove={(event) => {
            if (resizePointerRef.current !== event.pointerId) return;
            desktop.resizeTo(event.screenX);
          }}
          onPointerUp={(event) => {
            if (resizePointerRef.current !== event.pointerId) return;
            event.currentTarget.releasePointerCapture(event.pointerId);
            finishResize();
          }}
          onPointerCancel={finishResize}
          onLostPointerCapture={finishResize}
        />
      ) : null}
      <TopBar
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((o) => !o)}
        onNewConversation={() => {
          setPanelOpen(false);
          newConversation();
        }}
      />
      <div className={styles.main}>
        <ConversationPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
        <ChatArea inputAreaRef={inputAreaRef} />
        <InputArea ref={inputAreaRef} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ChatProvider>
      <ToastProvider>
        <ModalProvider>
          <ContextMenuProvider>
            <Shell />
          </ContextMenuProvider>
        </ModalProvider>
      </ToastProvider>
    </ChatProvider>
  );
}
