import { useEffect, useRef, useState, type RefObject } from 'react';
import type * as React from 'react';
import styles from './ScrollbarTrack.module.css';

interface ScrollbarTrackProps {
  /** 需要同步滚动状态的容器（滚动元素） */
  containerRef: RefObject<HTMLElement | null>;
  /** 内容变化时触发重新测量（如输入框的 value 长度） */
  deps?: unknown[];
  /** 轨道底部偏移（px），默认 2；用于让轨道止于悬浮输入框上方 */
  bottomOffset?: number;
}

/**
 * 自定义细滚动条：视觉统一（Fluent 浅色风）。
 * 支持拖拽滑块、点击轨道跳转；仅当内容可滚动时显示。
 */
export function ScrollbarTrack({
  containerRef,
  deps = [],
  bottomOffset = 2,
}: ScrollbarTrackProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!el || !track || !thumb) return;

    const measure = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = scrollHeight - clientHeight;
      if (max <= 0) {
        setVisible(false);
        return;
      }
      const trackH = track.clientHeight;
      const thumbH = Math.max(28, (clientHeight / scrollHeight) * trackH);
      const ratio = Math.min(1, Math.max(0, scrollTop / max));
      thumb.style.height = `${thumbH}px`;
      thumb.style.transform = `translateX(-50%) translateY(${ratio * Math.max(0, trackH - thumbH)}px)`;
      setVisible(true);
    };

    measure();
    el.addEventListener('scroll', measure, { passive: true });

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // 内容增减时重新测量（聊天区消息流变化）
    const mo = new MutationObserver(measure);
    mo.observe(el, { childList: true, subtree: true, characterData: true });

    return () => {
      el.removeEventListener('scroll', measure);
      ro.disconnect();
      mo.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, ...deps]);

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    const startY = e.clientY;
    const startTop = el.scrollTop;
    const max = el.scrollHeight - el.clientHeight;

    const move = (ev: PointerEvent) => {
      if (max <= 0) return;
      const dy = ev.clientY - startY;
      el.scrollTop = startTop + (dy / el.clientHeight) * max;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const clickTrack = (e: React.PointerEvent) => {
    const el = containerRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const rect = track.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
  };

  return (
    <div
      ref={trackRef}
      className={`${styles.track} ${visible ? styles.visible : ''}`}
      style={{ bottom: bottomOffset }}
      onPointerDown={clickTrack}
    >
      <div
        ref={thumbRef}
        className={styles.thumb}
        onPointerDown={startDrag}
      />
    </div>
  );
}
