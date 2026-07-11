'use client';

import { useState } from 'react';

interface AnimatedLogoProps {
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function AnimatedLogo({ showText = true, className = '', onClick }: AnimatedLogoProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`logo-container ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* Monogram box with corners and scan line */}
      <div style={{ position: 'relative', width: '36px', height: '36px' }}>
        {/* Corner brackets */}
        <div
          className="logo-corner"
          style={{
            position: 'absolute',
            top: '-3px',
            left: '-3px',
            width: '10px',
            height: '10px',
            borderTop: '1.5px solid #00ff66',
            borderLeft: '1.5px solid #00ff66',
            transition: 'border-color 0.3s',
            animation: 'logoCornerBlink 4s infinite',
          }}
        />
        <div
          className="logo-corner"
          style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            width: '10px',
            height: '10px',
            borderTop: '1.5px solid #00ff66',
            borderRight: '1.5px solid #00ff66',
            transition: 'border-color 0.3s',
            animation: 'logoCornerBlink 4s infinite 1s',
          }}
        />
        <div
          className="logo-corner"
          style={{
            position: 'absolute',
            bottom: '-3px',
            left: '-3px',
            width: '10px',
            height: '10px',
            borderBottom: '1.5px solid #00ff66',
            borderLeft: '1.5px solid #00ff66',
            transition: 'border-color 0.3s',
            animation: 'logoCornerBlink 4s infinite 2s',
          }}
        />
        <div
          className="logo-corner"
          style={{
            position: 'absolute',
            bottom: '-3px',
            right: '-3px',
            width: '10px',
            height: '10px',
            borderBottom: '1.5px solid #00ff66',
            borderRight: '1.5px solid #00ff66',
            transition: 'border-color 0.3s',
            animation: 'logoCornerBlink 4s infinite 3s',
          }}
        />

        {/* Monogram */}
        <div
          className="logo-monogram"
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Courier New', monospace",
            fontSize: '13px',
            fontWeight: 900,
            letterSpacing: '0.05em',
            color: isHovered ? '#00ccff' : '#00ff66',
            border: '1px solid',
            borderColor: isHovered ? '#00ccff' : '#00ff66',
            borderRadius: '2px',
            background: 'rgba(0, 255, 102, 0.04)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            animation: 'logoBorderGlow 3s ease-in-out infinite',
            textShadow: isHovered ? '0 0 15px rgba(0, 204, 255, 0.6)' : 'none',
          }}
        >
          {/* Scan line */}
          <div
            className="logo-scan"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(0, 255, 102, 0.8), transparent)',
              animation: 'logoScan 3s ease-in-out infinite',
              animationDuration: isHovered ? '0.8s' : '3s',
            }}
          />
          iM
        </div>
      </div>

      {/* Logo text */}
      {showText && (
        <span
          className="logo-text"
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: isHovered ? '#00ccff' : '#00ff66',
            textTransform: 'uppercase',
            transition: 'all 0.3s ease',
            textShadow: isHovered ? '0 0 8px rgba(0, 204, 255, 0.4)' : 'none',
          }}
        >
          indications
        </span>
      )}
    </div>
  );
}
