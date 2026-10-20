'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

type ConfigKey =
  | 'startWidth'
  | 'startHeight'
  | 'startRadius'
  | 'endRadius'
  | 'mediaZoom'
  | 'scrollDistance'
  | 'holdDistance'
  | 'smoothing'
  | 'overlayScrim'
  | 'useWindowScroll'
  | 'enabled';

export interface ScrollExpandProps {
  src?: string;
  mediaType?: 'image' | 'video';
  poster?: string;
  alt?: string;
  title?: string;
  scrollHint?: string;
  startWidth?: number;
  startHeight?: number;
  startRadius?: number;
  endRadius?: number;
  mediaZoom?: number;
  scrollDistance?: number;
  holdDistance?: number;
  smoothing?: number;
  overlayScrim?: number;
  useWindowScroll?: boolean;
  enabled?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}

const ScrollExpand: React.FC<ScrollExpandProps> = ({
  src = '',
  mediaType = 'image',
  poster = '',
  alt = '',
  title = '',
  scrollHint = '',
  startWidth = 54,
  startHeight = 64,
  startRadius = 28,
  endRadius = 0,
  mediaZoom = 1.25,
  scrollDistance = 1.3,
  holdDistance = 0.7,
  smoothing = 0.05,
  overlayScrim = 0.65,
  useWindowScroll = true,
  enabled = true,
  children,
  className = '',
  style,
  ...rest
}: ScrollExpandProps) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const mediaRef = useRef<any>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const scrimRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);

  const currentProgressRef = useRef<number>(0);
  const isMobileRef = useRef<boolean>(false);
  const isTouchRef = useRef<boolean>(false);

  const propsRef = useRef<Required<Pick<ScrollExpandProps, ConfigKey>>>({
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    useWindowScroll,
    enabled
  });

  propsRef.current = {
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    useWindowScroll,
    enabled
  };

  const applyProgress = useCallback((p: number) => {
    currentProgressRef.current = p;
    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!frame || !media) return;
    const c = propsRef.current;

    const e = smoothstep(0, 1, p);
    const isMob = isMobileRef.current;

    // Responsive start dimensions: On mobile phone, card is wider (88% vs 54%)
    const initW = isMob ? 88 : c.startWidth;
    const initH = isMob ? 72 : c.startHeight;
    const initR = isMob ? 20 : c.startRadius;

    // 1. Clip path interpolation (expands smoothly to 100% full screen, reverses smoothly to inset card)
    const w = initW + (100 - initW) * e;
    const h = initH + (100 - initH) * e;
    const ix = Math.max(0, (100 - w) / 2);
    const iy = Math.max(0, (100 - h) / 2);
    const r = initR + (c.endRadius - initR) * e;
    frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;

    // 2. Media zoom interpolation
    const zoom = c.mediaZoom + (1 - c.mediaZoom) * e;
    media.style.transform = `scale(${zoom})`;

    // 3. Dark gradient scrim opacity
    if (scrimRef.current) {
      scrimRef.current.style.opacity = `${c.overlayScrim * e}`;
    }

    // 4. Initial title fade-out and gentle rise (fades back in when scrolling reverse)
    if (titleRef.current) {
      const titleFade = smoothstep(0.12, 0.55, p);
      titleRef.current.style.opacity = `${1 - titleFade}`;
      titleRef.current.style.transform = `translate3d(0, ${-28 * titleFade}px, 0)`;
      titleRef.current.style.pointerEvents = 'none';
      titleRef.current.style.visibility = titleFade >= 0.98 ? 'hidden' : 'visible';
    }

    // 5. Scroll hint fade-out (fades back in when scrolling reverse)
    if (hintRef.current) {
      const hintFade = smoothstep(0.0, 0.22, p);
      hintRef.current.style.opacity = `${1 - hintFade}`;
      hintRef.current.style.transform = `translate3d(0, ${14 * hintFade}px, 0)`;
      hintRef.current.style.pointerEvents = hintFade >= 0.85 ? 'none' : 'auto';
      hintRef.current.style.visibility = hintFade >= 0.98 ? 'hidden' : 'visible';
    }

    // 6. Final content (Headlines & Search Form) fade-in and slide-up (fades out when scrolling reverse)
    if (overlayRef.current) {
      const contentFade = smoothstep(0.38, 0.88, p);
      overlayRef.current.style.opacity = `${contentFade}`;
      overlayRef.current.style.transform = `translate3d(0, ${26 * (1 - contentFade)}px, 0)`;
      overlayRef.current.style.pointerEvents = contentFade >= 0.7 ? 'auto' : 'none';
      overlayRef.current.style.visibility = contentFade <= 0.02 ? 'hidden' : 'visible';
    }
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    isTouchRef.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    let raf = 0;
    let current = 0;
    let target = 0;
    let stageH = window.innerHeight;
    let running = false;

    const measure = () => {
      const c = propsRef.current;
      isMobileRef.current = window.innerWidth < 768;
      stageH = c.useWindowScroll ? window.innerHeight : track.clientHeight;
      if (stageH <= 0) return;

      const totalMultiplier = 1 + Math.max(0.5, c.scrollDistance) + Math.max(0.2, c.holdDistance);
      const totalTrackH = Math.round(stageH * totalMultiplier);

      track.style.height = `${totalTrackH}px`;
      stage.style.height = `${stageH}px`;

      const w = track.clientWidth || window.innerWidth || stageH;
      stage.style.setProperty('--se-title-size', `${clamp(w * 0.055, 20, 68)}px`);
    };

    const readProgress = () => {
      const c = propsRef.current;
      if (!c.enabled) return 1;
      const span = stageH * Math.max(0.1, c.scrollDistance);
      if (c.useWindowScroll) {
        const top = track.getBoundingClientRect().top;
        // When top is 0, progress is 0. As top moves down by -span, progress moves to 1.
        // When scrolling reverse, top moves back towards 0, progress smoothly decreases to 0.
        return clamp(-top / span, 0, 1);
      }
      return clamp(track.scrollTop / span, 0, 1);
    };

    const tick = () => {
      const c = propsRef.current;
      const k = c.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * Math.max(0.01, c.smoothing)));
      current += (target - current) * k;

      if (Math.abs(target - current) < 0.001) {
        current = target;
        running = false;
      }

      applyProgress(current);
      raf = running ? requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (running) return;
      running = true;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = readProgress();
      if (propsRef.current.smoothing <= 0 || reduceMotion || isTouchRef.current) {
        current = target;
        applyProgress(current);
        return;
      }
      kick();
    };

    const onResize = () => {
      measure();
      target = readProgress();
      current = target;
      applyProgress(current);
    };

    // Initial measurement & first frame
    measure();
    target = readProgress();
    current = target;
    applyProgress(current);

    const scroller = useWindowScroll ? window : track;
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    const ro = new ResizeObserver(onResize);
    ro.observe(track);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      ro.disconnect();
    };
  }, [applyProgress, useWindowScroll]);

  // Click on initial collapsed card smoothly expands the hero to 100%
  const handleStageClick = (e: React.MouseEvent) => {
    if (useWindowScroll && trackRef.current && currentProgressRef.current < 0.4) {
      const targetTag = (e.target as HTMLElement).tagName.toLowerCase();
      if (targetTag === 'button' || targetTag === 'input' || targetTag === 'select' || targetTag === 'a' || targetTag === 'label') {
        return;
      }
      const span = (window.innerHeight || 800) * propsRef.current.scrollDistance;
      const targetY = trackRef.current.offsetTop + span * 1.05;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  };

  const media =
    mediaType === 'video' ? (
      <video
        ref={mediaRef}
        className="absolute inset-0 w-full h-full object-cover origin-center select-none"
        style={{ willChange: 'transform' }}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
      />
    ) : (
      <img
        ref={mediaRef}
        className="absolute inset-0 w-full h-full object-cover origin-center select-none"
        style={{ willChange: 'transform' }}
        src={src}
        alt={alt}
        draggable={false}
      />
    );

  return (
    <div
      ref={trackRef}
      className={`relative w-full ${className}`.trim()}
      style={{
        position: 'relative',
        width: '100%',
        height: '280vh',
        overflow: 'visible',
        ...style
      }}
      onClick={handleStageClick}
      {...rest}
    >
      {/* Sticky Stage: strictly pinned to top: 0 with exact 100vh/100dvh height */}
      <div
        ref={stageRef}
        className="sticky top-0 w-full overflow-hidden [--se-title-size:3.5rem]"
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: '100vh',
          zIndex: 10
        }}
      >
        {/* Animated Frame: clip-path expands from rounded inset to 100% full screen */}
        <div
          ref={frameRef}
          className="absolute inset-0"
          style={{
            clipPath: 'inset(18% 23% 18% 23% round 28px)',
            willChange: 'clip-path'
          }}
        >
          {media}

          {/* Deep Cinematic Gradient Scrim */}
          <div
            ref={scrimRef}
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0,
              background: 'linear-gradient(180deg, rgba(16, 18, 22, 0.88) 0%, rgba(20, 22, 26, 0.48) 45%, rgba(16, 18, 22, 0.95) 100%)',
              transition: 'opacity 0.05s linear'
            }}
          />

          {/* Expanded Children: Headlines & Ultra-Wide Find Your Car Search Bar */}
          {children ? (
            <div
              ref={overlayRef}
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 sm:p-6 md:p-8 overflow-y-auto"
              style={{
                opacity: 0,
                transform: 'translate3d(0, 26px, 0)',
                pointerEvents: 'none',
                willChange: 'opacity, transform',
                maxHeight: '100%'
              }}
            >
              {children}
            </div>
          ) : null}
        </div>

        {/* Initial Teaser Title: Visible while card is centered & rounded, fades on scroll */}
        {title ? (
          <div
            ref={titleRef}
            className="absolute inset-0 flex flex-col items-center justify-center m-0 px-6 text-center font-extrabold leading-tight tracking-tight text-white pointer-events-none"
            style={{
              fontSize: 'var(--se-title-size)',
              textShadow: '0 4px 28px rgba(0,0,0,0.7)',
              willChange: 'opacity, transform'
            }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-bold uppercase tracking-widest text-[#E8DBB3] mb-3 shadow-lg">
              VELOCE Concierge Fleet
            </span>
            <span>{title}</span>
          </div>
        ) : null}

        {/* Scroll / Tap Hint */}
        {scrollHint ? (
          <div
            ref={hintRef}
            className="absolute inset-x-0 bottom-6 text-center text-xs sm:text-sm tracking-wider text-white/85 font-semibold cursor-pointer select-none flex items-center justify-center gap-1.5 hover:text-[#CE2626] transition-colors"
            style={{
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
              willChange: 'opacity, transform'
            }}
          >
            <span>{scrollHint}</span>
            <span className="material-symbols-outlined text-[16px] animate-bounce text-[#CE2626]">arrow_downward</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ScrollExpand;
