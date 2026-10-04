/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			navy: {
  				DEFAULT: '#26275D',
  				light: '#3A3B7A',
  				soft: '#F4F5F8'
  			},
  			yellow: {
  				DEFAULT: '#F9DD0E',
  				soft: '#FEF3B0',
  				deep: '#E5C700'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: '#26275D',
  				foreground: '#FFFFFF'
  			},
  			secondary: {
  				DEFAULT: '#F4F5F8',
  				foreground: '#26275D'
  			},
  			muted: {
  				DEFAULT: '#F7F8FC',
  				foreground: '#6B6E8F'
  			},
  			accent: {
  				DEFAULT: '#F9DD0E',
  				foreground: '#26275D'
  			},
  			destructive: {
  				DEFAULT: '#E85D4A',
  				foreground: '#FFFFFF'
  			},
  			border: 'rgba(38, 39, 93, 0.08)',
  			input: 'rgba(38, 39, 93, 0.15)',
  			ring: '#26275D',
  			chart: {
  				'1': '#26275D',
  				'2': '#F9DD0E',
  				'3': '#3A3B7A',
  				'4': '#FEF3B0',
  				'5': '#6B6E8F'
  			}
  		},
  		fontFamily: {
  			heading: ['"Be Vietnam Pro"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			body: ['"Be Vietnam Pro"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			display: ['"Be Vietnam Pro"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			mono: ['ui-monospace', 'SFMono-Regular', 'Menaco', 'Consolas', 'monospace']
  		},
  		keyframes: {
  			'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
  			'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
  			'fg-float': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-8px)' }
  			},
  			'fg-pulse-soft': {
  				'0%, 100%': { transform: 'scale(1) translateY(0)' },
  				'50%': { transform: 'scale(1.015) translateY(-3px)' }
  			},
  			'fg-shake': {
  				'0%, 100%': { transform: 'translateX(0)' },
  				'25%': { transform: 'translateX(-4px)' },
  				'75%': { transform: 'translateX(4px)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fg-float': 'fg-float 6s ease-in-out infinite',
  			'fg-pulse-soft': 'fg-pulse-soft 4s ease-in-out infinite',
  			'fg-shake': 'fg-shake 0.3s ease-in-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
