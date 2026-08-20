import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import styles from './ContextMenu.module.css';

export interface MenuItem {
  label: string;
  danger?: boolean;
  onClick?: () => void;
}

interface MenuState {
  x: number;
  y: number;
  items: MenuItem[];
}

interface ContextMenuContextValue {
  showMenu: (x: number, y: number, items: MenuItem[]) => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

const MENU_PADDING = 8;

export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setMenu(null), []);

  const showMenu = useCallback((x: number, y: number, items: MenuItem[]) => {
    setMenu({ x, y, items });
  }, []);

  // 边界修正：菜单不超出视口
  useLayoutEffect(() => {
    if (!menu) return;
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let { x, y } = menu;
    if (x + rect.width > window.innerWidth - MENU_PADDING) {
      x = Math.max(MENU_PADDING, window.innerWidth - rect.width - MENU_PADDING);
    }
    if (y + rect.height > window.innerHeight - MENU_PADDING) {
      y = Math.max(MENU_PADDING, window.innerHeight - rect.height - MENU_PADDING);
    }
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menu, close]);

  const value = useMemo(() => ({ showMenu }), [showMenu]);

  return (
    <ContextMenuContext.Provider value={value}>
      {children}
      {menu && (
        <>
          <div className={styles.backdrop} onMouseDown={close} />
          <div
            ref={menuRef}
            className={styles.menu}
            style={{ left: menu.x, top: menu.y }}
            role="menu"
          >
            {menu.items.map((item, idx) => (
              <button
                key={idx}
                className={`${styles.item} ${item.danger ? styles.danger : ''}`}
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick?.();
                  close();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </ContextMenuContext.Provider>
  );
}

export function useContextMenu(): ContextMenuContextValue {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) throw new Error('useContextMenu 必须在 ContextMenuProvider 内使用');
  return ctx;
}
