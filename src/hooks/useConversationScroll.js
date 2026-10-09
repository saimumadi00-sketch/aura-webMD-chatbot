import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// A single animation owns scrolling. Resizes update its destination rather than interrupt it.
export default function useConversationScroll(messages, loading, threadKey) {
  const panelRef = useRef(null);
  const contentRef = useRef(null);
  const follow = useRef(true);
  const animation = useRef(null);
  const previous = useRef(null);
  const [showLatest, setShowLatest] = useState(false);
  const cancel = useCallback(() => {
    if (animation.current) cancelAnimationFrame(animation.current.frame);
    animation.current = null;
  }, []);
  const scrollToLatest = useCallback((smooth = true) => {
    const panel = panelRef.current;
    if (!panel) return;
    follow.current = true;
    setShowLatest(false);
    if (animation.current) return;
    const target = Math.max(0, panel.scrollHeight - panel.clientHeight);
    if (!smooth || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      panel.scrollTop = target;
      return;
    }
    const start = panel.scrollTop;
    if (Math.abs(target - start) < 2) return;
    const motion = { frame: null, started: null };
    animation.current = motion;
    const step = time => {
      if (animation.current !== motion) return;
      motion.started ??= time;
      const progress = Math.min(1, (time - motion.started) / 260);
      const destination = Math.max(0, panel.scrollHeight - panel.clientHeight);
      panel.scrollTop = start + (destination - start) * (1 - (1 - progress) ** 3);
      if (progress < 1) motion.frame = requestAnimationFrame(step);
      else { animation.current = null; panel.scrollTop = destination; }
    };
    motion.frame = requestAnimationFrame(step);
  }, []);
  const interrupt = useCallback(() => { cancel(); follow.current = false; }, [cancel]);
  const onScroll = useCallback(() => {
    const panel = panelRef.current;
    if (!panel || animation.current) return;
    const nearBottom = panel.scrollHeight - panel.scrollTop - panel.clientHeight < 48;
    follow.current = nearBottom;
    setShowLatest(!nearBottom);
  }, []);
  const onContentResize = useCallback(() => {
    if (follow.current && !animation.current) scrollToLatest(false);
  }, [scrollToLatest]);
  useLayoutEffect(() => {
    const old = previous.current;
    const changedThread = !old || old.threadKey !== threadKey || (old.messages.length && old.messages[0]?.id !== messages[0]?.id);
    const sent = old && messages.length > old.messages.length && messages.at(-1)?.sender === 'user';
    if (changedThread) { cancel(); scrollToLatest(false); }
    else if (sent || follow.current) scrollToLatest(true);
    previous.current = { messages, threadKey };
  }, [messages, loading, threadKey, cancel, scrollToLatest]);
  useEffect(() => {
    const observer = new ResizeObserver(onContentResize);
    if (panelRef.current) observer.observe(panelRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => { observer.disconnect(); cancel(); };
  }, [cancel, onContentResize]);
  return { panelRef, contentRef, showLatest, scrollToLatest, interrupt, onScroll, onContentResize };
}
