import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type * as React from 'react';
import styles from './Modal.module.css';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  danger?: boolean;
  onConfirm: () => void;
}

export interface PromptOptions {
  title: string;
  initial?: string;
  maxLength?: number;
  onConfirm: (value: string) => void;
}

interface ModalContextValue {
  confirm: (opts: ConfirmOptions) => void;
  prompt: (opts: PromptOptions) => void;
}

type ModalState =
  | { kind: 'confirm'; opts: ConfirmOptions }
  | { kind: 'prompt'; opts: PromptOptions }
  | null;

const ModalContext = createContext<ModalContextValue | null>(null);
const MODAL_EXIT_MS = 170;

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>(null);
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const close = useCallback(() => {
    setClosing(true);
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setModal(null);
      setClosing(false);
      closeTimerRef.current = null;
    }, MODAL_EXIT_MS);
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setClosing(false);
    setModal({ kind: 'confirm', opts });
  }, []);

  const prompt = useCallback((opts: PromptOptions) => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setClosing(false);
    setModal({ kind: 'prompt', opts });
  }, []);

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (modal?.kind === 'prompt') {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [modal]);

  const value = useMemo(() => ({ confirm, prompt }), [confirm, prompt]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
    if (modal?.kind === 'prompt' && e.key === 'Enter') {
      e.preventDefault();
      const v = inputRef.current?.value ?? '';
      if (v.trim()) {
        modal.opts.onConfirm(v);
        close();
      }
    }
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modal && (
        <div
          className={`${styles.overlay} ${closing ? styles.closing : ''}`}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          onKeyDown={onKeyDown}
        >
          <div className={styles.card} role="dialog" aria-modal="true">
            {modal.kind === 'confirm' ? (
              <>
                <h3 className={styles.title}>{modal.opts.title}</h3>
                {modal.opts.message && (
                  <p className={styles.message}>{modal.opts.message}</p>
                )}
                <div className={styles.buttons}>
                  <button className={styles.btn} onClick={close}>
                    取消
                  </button>
                  <button
                    className={
                      modal.opts.danger
                        ? `${styles.btn} ${styles.danger}`
                        : `${styles.btn} ${styles.primary}`
                    }
                    onClick={() => {
                      modal.opts.onConfirm();
                      close();
                    }}
                  >
                    {modal.opts.confirmText ?? '确认'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className={styles.title}>{modal.opts.title}</h3>
                <input
                  ref={inputRef}
                  className={styles.input}
                  defaultValue={modal.opts.initial ?? ''}
                  maxLength={modal.opts.maxLength ?? 30}
                  placeholder="输入内容"
                />
                <div className={styles.buttons}>
                  <button className={styles.btn} onClick={close}>
                    取消
                  </button>
                  <button
                    className={`${styles.btn} ${styles.primary}`}
                    onClick={() => {
                      const v = inputRef.current?.value ?? '';
                      if (!v.trim()) return;
                      modal.opts.onConfirm(v);
                      close();
                    }}
                  >
                    确定
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal 必须在 ModalProvider 内使用');
  return ctx;
}
