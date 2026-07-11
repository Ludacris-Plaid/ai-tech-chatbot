/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'im-bg': '#030806',
        'im-bg-2': '#0a0f0c',
        'im-bg-3': '#101712',
        'im-border': '#1a2420',
        'im-border-bright': '#2a3a32',
        'im-text': '#e6f5ec',
        'im-text-dim': '#7a8a82',
        'im-green': '#00ff66',
        'im-green-dim': '#00cc52',
        'im-green-glow': 'rgba(0, 255, 102, 0.4)',
        'im-pink': '#ff3366',
        'im-cyan': '#00e5ff',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'im-grid':
          "linear-gradient(rgba(0, 255, 102, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 102, 0.04) 1px, transparent 1px)",
        'im-radial':
          'radial-gradient(ellipse at top, rgba(0, 255, 102, 0.12), transparent 60%)',
      },
      animation: {
        'im-fade-in': 'imFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        'im-glow': 'imGlow 2.4s ease-in-out infinite alternate',
        'im-pulse-dot': 'imPulseDot 1.2s ease-in-out infinite',
        'im-shimmer': 'imShimmer 3s linear infinite',
        'im-scanline': 'imScanline 8s linear infinite',
        'im-blink': 'imBlink 1s steps(2) infinite',
      },
      keyframes: {
        imFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        imGlow: {
          '0%': { boxShadow: '0 0 12px rgba(0, 255, 102, 0.25)' },
          '100%': { boxShadow: '0 0 28px rgba(0, 255, 102, 0.55)' },
        },
        imPulseDot: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.85)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        imShimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        imScanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        imBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
