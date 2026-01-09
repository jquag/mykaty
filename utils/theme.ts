export const Fonts = {
	heading: 'Fraunces_700Bold',
	headingRegular: 'Fraunces_400Regular',
};

export const Colors = {
	light: {
		primary: colorFn('rgb(163, 169, 101)'),
		border: colorFn('rgb(255, 251, 206)'),
		secondary: colorFn('rgb(153, 123, 89)'),
		text: colorFn('rgb(0, 0, 0)'),
		surface: colorFn('rgb(253 255 225)'),
		accent: colorFn('rgb(198, 108, 72)'),
	},
	dark: {
		primary: colorFn('rgb(180, 186, 120)'),
		border: colorFn('rgb(60, 58, 40)'),
		secondary: colorFn('rgb(178, 144, 104)'),
		text: colorFn('rgb(240, 238, 220)'),
		surface: colorFn('rgb(28, 30, 22)'),
		accent: colorFn('rgb(198, 108, 72)'),
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
