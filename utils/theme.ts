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
		/** Sequential ramp from least to most, readable on `surface` */
		heat: ['rgb(150, 187, 56)', 'rgb(75, 159, 80)', 'rgb(0, 126, 108)', 'rgb(0, 90, 111)', 'rgb(23, 55, 102)'],
	},
	dark: {
		primary: colorFn('rgb(183 231 150)'),
		border: colorFn('rgb(60, 58, 40)'),
		secondary: colorFn('rgb(178, 144, 104)'),
		text: colorFn('rgb(240, 238, 220)'),
		surface: colorFn('rgb(18, 24, 38)'),
		accent: colorFn('rgb(220, 100, 110)'),
		white: colorFn('rgb(255, 255, 255)'),
		heat: ['rgb(51, 112, 148)', 'rgb(51, 150, 155)', 'rgb(77, 188, 146)', 'rgb(156, 221, 118)', 'rgb(234, 241, 135)'],
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
