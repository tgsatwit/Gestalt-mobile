import React, { createContext, useContext, useMemo } from 'react';
import { tokens, ThemeTokens } from './tokens';
import { Text as RNText, TextProps as RNTextProps, View as RNView, ViewProps as RNViewProps } from 'react-native';

export type ThemeContextValue = {
	tokens: ThemeTokens;
	fontLoaded: boolean;
};

const ThemeContext = createContext<ThemeContextValue>({ tokens, fontLoaded: false });

export const ThemeProvider: React.FC<{ children: React.ReactNode; fontLoaded: boolean }> = ({ children, fontLoaded }) => {
	const value = useMemo(() => ({ tokens, fontLoaded }), [fontLoaded]);
	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export type TextProps = RNTextProps & { 
	weight?: 'regular' | 'medium' | 'semibold' | 'bold'; 
	color?: keyof ThemeTokens['color']['text'] | 'white';
	size?: keyof ThemeTokens['font']['size'];
};

export const Text: React.FC<TextProps> = ({ style, weight = 'regular', color = 'primary', size = 'body', children, ...rest }) => {
	const { tokens } = useTheme();
	
	// Map 'bold' weight to 'semibold' font family since we don't have a Bold variant
	const fontWeight = weight === 'bold' ? 'semibold' : weight;
	const fontFamily = fontWeight === 'semibold' ? `${tokens.font.family.primary}-SemiBold` : fontWeight === 'medium' ? `${tokens.font.family.primary}-Medium` : tokens.font.family.primary;
	
	// Handle special color values
	const textColor = color === 'white' ? '#FFFFFF' : tokens.color.text[color as keyof ThemeTokens['color']['text']];
	
	// Get font size from tokens
	const fontSize = tokens.font.size[size];
	const lineHeight = Math.round(fontSize * 1.6);
	
	return (
		<RNText
			style={[{ color: textColor, fontFamily, fontSize, lineHeight }, style]}
			{...rest}
		>
			{children}
		</RNText>
	);
};

export const View: React.FC<RNViewProps> = ({ style, children, ...rest }) => {
	return (
		<RNView style={style} {...rest}>
			{children}
		</RNView>
	);
};

// Re-export tokens for direct access
export { tokens } from './tokens';
export type { ThemeTokens } from './tokens';