import { useLayoutEffect, useRef } from 'react';
import './auth-fit.css';

export function useFitAuthForm() {
  const areaRef = useRef(null);
  const cardRef = useRef(null);
  useLayoutEffect(() => {
    const area = areaRef.current;
    const card = cardRef.current;
    if (!area || !card) return;
    const fit = () => { card.dataset.compact = String(area.clientHeight < 850); };
    const observer = new ResizeObserver(fit);
    observer.observe(area);
    fit();
    return () => observer.disconnect();
  }, []);
  return { areaRef, cardRef };
}
