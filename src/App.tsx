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

  return (
    <div className="app-shell">
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
