'use client';

import { useState, useEffect, useRef } from 'react';

const MATRIX_CHARS =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*<>/';

interface GlitchTitleProps {
  text: string;
  variant?: 'header' | 'hero';
  className?: string;
}

export default function GlitchTitle({ text, variant = 'header', className = '' }: GlitchTitleProps) {
  const [displayChars, setDisplayChars] = useState<string[]>(() => text.split(''));
  const [glitchIndices, setGlitchIndices] = useState<Set<number>>(new Set());
  const original = useRef(text.split(''));

  // Keep original in sync if text prop changes
  useEffect(() => {
    original.current = text.split('');
  }, [text]);

  // Randomly trigger glitch bursts
  useEffect(() => {
    const scheduleBurst = () => {
      const delay = 2000 + Math.random() * 5000; // 2–7s between bursts

      return setTimeout(() => {
        // Pick 1–3 characters to glitch
        const count = Math.min(1 + Math.floor(Math.random() * 3), text.length);
        const indices = new Set<number>();
        while (indices.size < count) {
          indices.add(Math.floor(Math.random() * text.length));
        }

        setGlitchIndices(indices);

        // Flicker through Matrix chars
        let tick = 0;
        const flicker = setInterval(() => {
          setDisplayChars((prev) => {
            const next = [...prev];
            for (const idx of indices) {
              // Occasionally snap back briefly for realistic glitch feel
              if (Math.random() < 0.15) {
                next[idx] = original.current[idx];
              } else {
                next[idx] = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
              }
            }
            return next;
          });
          tick++;
          if (tick > 15) {
            clearInterval(flicker);
          }
        }, 55);

        // End burst: reset to original
        setTimeout(() => {
          clearInterval(flicker);
          setDisplayChars([...original.current]);
          setGlitchIndices(new Set());
          scheduleBurst(); // schedule next
        }, 200 + Math.random() * 400); // 200–600ms burst
      }, delay);
    };

    const timeout = scheduleBurst();
    return () => clearTimeout(timeout);
  }, [text]);

  const isDash = (ch: string) => ch === '-';

  return (
    <span className={className} style={{ whiteSpace: 'nowrap' }}>
      {displayChars.map((ch, i) => {
        const isGlitching = glitchIndices.has(i);

        if (variant === 'header') {
          // Header: "indications" in green, "-" gray, "ai" in gray
          const color = isDash(ch)
            ? '#6b7280'
            : i < text.indexOf('-')
              ? '#00ff66'
              : '#e6f5ec';

          return (
            <span
              key={`${i}-${ch}`}
              className={isGlitching ? 'glitch-char' : ''}
              style={{
                color,
                display: 'inline-block',
                transition: 'color 0.15s',
                animation: isGlitching ? 'glitchSpin 0.4s ease-in-out' : undefined,
                transform: isGlitching ? 'scaleX(-1)' : undefined,
              }}
            >
              {isGlitching ? ch : original.current[i]}
            </span>
          );
        }

        // Hero variant: gradient text (green→cyan) per character
        const ratio = text.length > 1 ? i / (text.length - 1) : 0;
        const r = Math.round(0 + ratio * 0);
        const g = Math.round(255 - ratio * 255);
        const b = Math.round(102 - ratio * 102 + ratio * 229);

        return (
          <span
            key={`${i}-${ch}`}
            className={isGlitching ? 'glitch-char' : ''}
            style={{
              color: `rgb(${r}, ${g}, ${b})`,
              display: 'inline-block',
              transition: 'color 0.15s',
              animation: isGlitching ? 'glitchSpin 0.4s ease-in-out' : undefined,
              transform: isGlitching ? 'scaleX(-1)' : undefined,
              textShadow: isGlitching
                ? '0 0 8px rgba(0, 255, 102, 0.8), 0 0 20px rgba(0, 204, 255, 0.4)'
                : 'none',
            }}
          >
            {isGlitching ? ch : original.current[i]}
          </span>
        );
      })}
    </span>
  );
}
