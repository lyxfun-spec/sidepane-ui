import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { copyText } from '../utils/clipboard';
import { useToast } from './Toast';
import styles from './MarkdownView.module.css';

function isElement(n: ReactNode): n is ReactElement {
  return !!n && typeof n === 'object' && 'props' in n;
}

/** 递归提取代码块的纯文本（用于复制按钮） */
function extractCodeText(children: ReactNode): string {
  let out = '';
  const walk = (n: ReactNode): void => {
    if (typeof n === 'string' || typeof n === 'number') {
      out += n;
      return;
    }
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }
    if (isElement(n)) walk(n.props.children);
  };
  walk(children);
  return out;
}

export function MarkdownView({ content }: { content: string }) {
  const { push } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const copiedTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
    },
    []
  );

  return (
    <div className={styles.markdown}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer" />
          ),
          pre: ({ children }) => {
            const codeEl = Array.isArray(children) ? children[0] : children;
            const className = isElement(codeEl)
              ? String(codeEl.props.className ?? '')
              : '';
            const match = /language-([\w-]+)/.exec(className);
            const lang = match?.[1] ?? '';
            const raw = extractCodeText(children);
            return (
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>
                  <span className={styles.codeLang}>{lang || 'code'}</span>
                  <button
                    type="button"
                    className={styles.codeCopy}
                    onClick={() => {
                      copyText(raw);
                      setCopiedCode(raw);
                      if (copiedTimerRef.current !== null) {
                        window.clearTimeout(copiedTimerRef.current);
                      }
                      copiedTimerRef.current = window.setTimeout(
                        () => setCopiedCode(null),
                        1400
                      );
                      push('代码已复制', 'success');
                    }}
                  >
                    {copiedCode === raw ? '已复制' : '复制'}
                  </button>
                </div>
                <pre>{children}</pre>
              </div>
            );
          },
          table: ({ children }) => (
            <div className={styles.tableWrap}>
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
