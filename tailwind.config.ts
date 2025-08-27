import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					light: 'hsl(var(--primary-light))',
					dark: 'hsl(var(--primary-dark))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					light: 'hsl(var(--secondary-light))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
					light: 'hsl(var(--destructive-light))',
					glow: 'hsl(var(--destructive-glow))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))',
					light: 'hsl(var(--warning-light))',
					glow: 'hsl(var(--warning-glow))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))',
					light: 'hsl(var(--success-light))',
					glow: 'hsl(var(--success-glow))'
				},
				emergency: {
					DEFAULT: 'hsl(var(--emergency))',
					foreground: 'hsl(var(--emergency-foreground))',
					light: 'hsl(var(--emergency-light))',
					glow: 'hsl(var(--emergency-glow))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))',
					light: 'hsl(var(--info-light))',
					glow: 'hsl(var(--info-glow))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'spin': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				},
				'medical-pulse': {
					'0%, 100%': { 
						opacity: '1', 
						transform: 'scale(1)' 
					},
					'50%': { 
						opacity: '0.7', 
						transform: 'scale(1.05)' 
					}
				},
				'scan-line': {
					'0%': { transform: 'translateY(0%)' },
					'50%': { transform: 'translateY(2000%)' },
					'100%': { transform: 'translateY(0%)' }
				},
				'success-bounce': {
					'0%, 20%, 53%, 80%, 100%': { 
						transform: 'scale(1) rotate(0deg)' 
					},
					'40%, 43%': { 
						transform: 'scale(1.2) rotate(-5deg)' 
					},
					'70%': { 
						transform: 'scale(1.1) rotate(5deg)' 
					},
					'90%': { 
						transform: 'scale(1.05) rotate(-2deg)' 
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'spin': 'spin 1s linear infinite',
				'medical-pulse': 'medical-pulse 2s ease-in-out infinite',
				'scan-line': 'scan-line 2s ease-in-out infinite',
				'success-bounce': 'success-bounce 1s ease-in-out'
			},
			spacing: {
				'touch': 'var(--touch-target)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
