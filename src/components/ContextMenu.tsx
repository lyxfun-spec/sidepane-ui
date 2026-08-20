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
import { MARK_COLORS } from '../types';
import styles from './ContextMenu.module.css';

export interface MenuItem {
  label: string;
  danger?: boolean;
  onClick?: () => void;
  /** 提供该字段时，点击该项进入"标记颜色"选择视图 */
  onMarkPick?: (color: string | null) => void;
}

interface MenuState {
  x: number;
  y: number;
  items: MenuItem[];
  view: 'menu' | 'marks';
  currentMark: string | null;
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
    setMenu({ x, y, items, view: 'menu', currentMark: null });
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

  const markItem = menu?.items.find((i) => i.onMarkPick);
  const markColor = menu?.view === 'marks' ? menu.currentMark : null;

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
            {menu.view === 'marks' && markItem ? (
              <div className={styles.marks}>
                {MARK_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`${styles.swatch} ${markColor === color ? styles.selected : ''}`}
                    style={{ background: color }}
                    title={color}
                    onClick={(e) => {
                      e.stopPropagation();
                      markItem.onMarkPick?.(color);
                      close();
                    }}
                  />
                ))}
                <button
                  className={styles.clear}
                  onClick={(e) => {
                    e.stopPropagation();
                    markItem.onMarkPick?.(null);
                    close();
                  }}
                >
                  清除
                </button>
              </div>
            ) : (
              menu.items.map((item, idx) => (
                <button
                  key={idx}
                  className={`${styles.item} ${item.danger ? styles.danger : ''}`}
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.onMarkPick) {
                      setMenu((m) =>
                        m ? { ...m, view: 'marks', currentMark: null } : m
                      );
                      return;
                    }
                    item.onClick?.();
                    close();
                  }}
                >
                  {item.label}
                </button>
              ))
            )}
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
