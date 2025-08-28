export const color = {
	brand: {
		gradient: {
			start: '#5B21B6',
			mid: '#EC4899',
			end: '#FB923C',
		},
	},
	primary: {
		default: '#5B21B6', // Using brand gradient start as primary
	},
	surface: '#FFFFFF',
	bg: { muted: '#F9FAFB' },
	border: { default: '#E5E7EB', hover: '#D1D5DB' },
	text: { primary: '#111827', secondary: '#4B5563' },
	support: {
		green: '#22C55E',
		blue: '#3B82F6',
		teal: '#14B8A6',
		yellow: '#EAB308',
	},
};

export const radius = {
	pill: 9999,
	sm: 8,
	md: 10,
	lg: 12,
	xl: 16,
	'2xl': 20,
};

export const elevation = {
	0: 'rgba(0,0,0,0)',
	1: '0px 5px 10px rgba(0,0,0,0.12)',
	2: '0px 8px 30px rgba(0,0,0,0.12)',
};

export const spacing = {
	unit: 4,
	containerX: 16,
	sectionY: { sm: 24, md: 32 },
	gap: { xs: 8, sm: 12, md: 16, lg: 24 },
};

export const font = {
	family: {
		primary: 'PlusJakartaSans',
		secondary: 'Inter',
		accent: 'OoohBaby',
	},
	size: { h1: 34, h2: 30, h3: 24, xl: 20, lg: 18, body: 16, sm: 14, small: 14, xs: 12, caption: 12 },
};

export type ThemeTokens = {
	color: typeof color;
	radius: typeof radius;
	elevation: typeof elevation;
	spacing: typeof spacing;
	font: typeof font;
};

export const tokens: ThemeTokens = { color, radius, elevation, spacing, font };