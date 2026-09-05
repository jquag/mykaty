export const Fonts = {
	heading: 'Fraunces-Bold',
	headingRegular: 'Fraunces-Regular',
};

export const Colors = {
	light: {
		primary: colorFn('rgb(62 103 42)'),
		border: colorFn('rgb(255, 251, 206)'),
		secondary: colorFn('rgb(153, 123, 89)'),
		text: colorFn('rgb(0, 0, 0)'),
		surface: colorFn('rgb(253 255 225)'),
		accent: colorFn('rgb(220, 100, 110)'),
		white: colorFn('rgb(255, 255, 255)'),
	},
	dark: {
		primary: colorFn('rgb(183 231 150)'),
		border: colorFn('rgb(60, 58, 40)'),
		secondary: colorFn('rgb(178, 144, 104)'),
		text: colorFn('rgb(240, 238, 220)'),
		surface: colorFn('rgb(18, 24, 38)'),
		accent: colorFn('rgb(220, 100, 110)'),
		white: colorFn('rgb(255, 255, 255)'),
	},
};

function colorWithAlpha(color: string, alpha: number) {
	if (alpha === 1) return color;
	const [r, g, b] = color.match(/\d+/g)!;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function colorFn(color: string) {
	return (alpha?: number) => colorWithAlpha(color, alpha ?? 1);
}
