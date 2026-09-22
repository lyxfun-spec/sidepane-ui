import { Icon } from './Icon';
import styles from './TopBar.module.css';

interface TopBarProps {
  panelOpen: boolean;
  onTogglePanel: () => void;
  onNewConversation: () => void;
}

export function TopBar({ panelOpen, onTogglePanel, onNewConversation }: TopBarProps) {
  const desktop = window.sidepaneDesktop;

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <Icon name="spark" size={18} className={styles.logo} />
        <span className={styles.title}>SidePane AI</span>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.btn} ${panelOpen ? styles.active : ''}`}
          onClick={onTogglePanel}
          title="会话列表"
          aria-label="会话列表"
        >
          <Icon name="menu" size={17} />
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={onNewConversation}
          title="新建对话"
          aria-label="新建对话"
        >
          <Icon name="plus" size={17} />
        </button>
        {desktop ? (
          <button
            type="button"
            className={styles.btn}
            onClick={() => void desktop.hideWindow()}
            title="收起侧边栏"
            aria-label="收起侧边栏"
          >
            <Icon name="close" size={16} />
          </button>
        ) : null}
      </div>
    </header>
  );
}
