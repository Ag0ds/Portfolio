'use client';

import {
  ElementType,
  useEffect,
  useRef,
  useState,
  createElement,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { gsap } from 'gsap';
import '@/src/style/TextType.css';

export interface TextTypeHandle {
  start: () => void;
  stop: () => void;
  reset: () => void;
}

interface TextTypeProps {
  className?: string;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorCharacter?: string | React.ReactNode;
  cursorBlinkDuration?: number;
  cursorClassName?: string;
  text: string | string[];
  as?: ElementType;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  textColors?: string[];
  variableSpeed?: { min: number; max: number };
  onSentenceComplete?: (sentence: string, index: number) => void;
  startOnVisible?: boolean;
  reverseMode?: boolean;

  textStyle?: React.CSSProperties;
  cursorStyle?: React.CSSProperties;

  pauseOnHidden?: boolean;

  cursorBlinkMode?: 'css' | 'gsap' | 'none';

  startOnce?: boolean;
}

const TextType = forwardRef<TextTypeHandle, TextTypeProps & React.HTMLAttributes<HTMLElement>>(
  (
    {
      text,
      as: Component = 'div',
      typingSpeed = 50,
      initialDelay = 0,
      pauseDuration = 2000,
      deletingSpeed = 30,
      loop = true,
      className = '',
      showCursor = true,
      hideCursorWhileTyping = false,
      cursorCharacter = '|',
      cursorClassName = '',
      cursorBlinkDuration = 0.5,
      textColors = [],
      variableSpeed,
      onSentenceComplete,
      startOnVisible = false,
      reverseMode = false,
      textStyle,
      cursorStyle,
      pauseOnHidden = false,
      cursorBlinkMode = 'css',
      startOnce = true,
      ...props
    },
    ref
  ) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(!startOnVisible);
    const [running, setRunning] = useState(!startOnVisible); 

    const cursorRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLElement>(null);
    const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const blinkTweenRef = useRef<gsap.core.Tween | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);

    const processedText = useMemo(() => {
      const t = textArray[currentTextIndex] ?? '';
      return reverseMode ? t.split('').reverse().join('') : t;
    }, [textArray, currentTextIndex, reverseMode]);

    const getRandomSpeed = useCallback(() => {
      if (!variableSpeed) return typingSpeed;
      const { min, max } = variableSpeed;
      return Math.random() * (max - min) + min;
    }, [variableSpeed, typingSpeed]);

    const currentColor = useMemo(() => {
      if (!textColors.length) return undefined;
      return textColors[currentTextIndex % textColors.length];
    }, [textColors, currentTextIndex]);

    useEffect(() => {
      if (!startOnVisible || !containerRef.current) return;

      const el = containerRef.current;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setIsVisible(true);
              setRunning(true);
              if (startOnce && observerRef.current) {
                observerRef.current.unobserve(el);
                observerRef.current.disconnect();
                observerRef.current = null;
              }
            } else if (pauseOnHidden) {
              setRunning(false);
            }
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
      );

      observerRef.current.observe(el);
      return () => {
        observerRef.current?.unobserve(el);
        observerRef.current?.disconnect();
        observerRef.current = null;
      };
    }, [startOnVisible, pauseOnHidden, startOnce]);

    useEffect(() => {
      if (!showCursor) return;

      blinkTweenRef.current?.kill();
      blinkTweenRef.current = null;

      if (cursorBlinkMode === 'gsap' && cursorRef.current) {
        gsap.set(cursorRef.current, { opacity: 1 });
        blinkTweenRef.current = gsap.to(cursorRef.current, {
          opacity: 0,
          duration: cursorBlinkDuration,
          repeat: -1,
          yoyo: true,
          ease: 'power2.inOut',
        });
      }
      return () => {
        blinkTweenRef.current?.kill();
        blinkTweenRef.current = null;
      };
    }, [showCursor, cursorBlinkDuration, cursorBlinkMode]);

    const clearAllTimeouts = useCallback(() => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    }, []);

    useEffect(() => {
      if (!isVisible || !running) return;

      clearAllTimeouts();

      const schedule = (fn: () => void, ms: number) => {
        const id = setTimeout(fn, ms);
        timeoutsRef.current.push(id);
      };

      const onFinishSentence = () => {
        onSentenceComplete?.(textArray[currentTextIndex], currentTextIndex);
      };

      const startDeleting = () => setIsDeleting(true);

      const advanceSentence = () => {
        setIsDeleting(false);
        setCurrentCharIndex(0);
        setDisplayedText('');
        setCurrentTextIndex((prev) => (prev + 1) % textArray.length);
      };

      const run = () => {
        if (isDeleting) {
          if (displayedText.length === 0) {
            if (currentTextIndex === textArray.length - 1 && !loop) {
              setRunning(false);
              onFinishSentence();
              return;
            }
            onFinishSentence();
            schedule(advanceSentence, pauseDuration);
          } else {
            schedule(() => setDisplayedText((prev) => prev.slice(0, -1)), deletingSpeed);
          }
          return;
        }

        if (currentCharIndex < processedText.length) {
          schedule(() => {
            setDisplayedText((prev) => prev + processedText[currentCharIndex]);
            setCurrentCharIndex((prev) => prev + 1);
          }, variableSpeed ? getRandomSpeed() : typingSpeed);
        } else {
          if (textArray.length > 1) {
            schedule(startDeleting, pauseDuration);
          } else if (!loop) {
            onFinishSentence();
            setRunning(false);
          } else {
            schedule(() => {
              setDisplayedText('');
              setCurrentCharIndex(0);
            }, pauseDuration);
          }
        }
      };

      if (currentCharIndex === 0 && !isDeleting && displayedText === '') {
        schedule(run, initialDelay);
      } else {
        run();
      }

      return clearAllTimeouts;
    }, [
      isVisible,
      running,
      isDeleting,
      displayedText,
      currentCharIndex,
      processedText,
      textArray,
      currentTextIndex,
      loop,
      initialDelay,
      pauseDuration,
      typingSpeed,
      deletingSpeed,
      variableSpeed,
      getRandomSpeed,
      onSentenceComplete,
      clearAllTimeouts,
    ]);

    useImperativeHandle(
      ref,
      () => ({
        start: () => setRunning(true),
        stop: () => setRunning(false),
        reset: () => {
          setRunning(false);
          setDisplayedText('');
          setCurrentCharIndex(0);
          setIsDeleting(false);
          setCurrentTextIndex(0);
        },
      }),
      []
    );

    const shouldHideCursor =
      showCursor &&
      hideCursorWhileTyping &&
      (currentCharIndex < processedText.length || isDeleting);

    return createElement(
      Component,
      {
        ref: containerRef,
        className: `text-type ${className} ${cursorBlinkMode === 'css' ? 'text-type--blink' : ''}`,
        'aria-live': 'polite',
        ...props,
      },
      <span
        className="text-type__content"
        style={{ color: currentColor ?? 'inherit', ...textStyle }}
      >
        {displayedText}
      </span>,
      showCursor && (
        <span
          ref={cursorRef}
          className={`text-type__cursor ${cursorClassName} ${
            shouldHideCursor ? 'text-type__cursor--hidden' : ''
          }`}
          style={cursorStyle}
        >
          {cursorCharacter}
        </span>
      )
    );
  }
);

TextType.displayName = 'TextType';
export default TextType;
