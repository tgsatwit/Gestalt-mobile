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

export type TextProps = RNTextProps & { weight?: 'regular' | 'medium' | 'semibold'; color?: keyof ThemeTokens['color']['text'] };

export const Text: React.FC<TextProps> = ({ style, weight = 'regular', color = 'primary', children, ...rest }) => {
	const { tokens } = useTheme();
	const fontFamily = weight === 'semibold' ? `${tokens.font.family.primary}-SemiBold` : weight === 'medium' ? `${tokens.font.family.primary}-Medium` : tokens.font.family.primary;
	return (
		<RNText
			style={[{ color: tokens.color.text[color], fontFamily, fontSize: tokens.font.size.body, lineHeight: Math.round(tokens.font.size.body * 1.6) }, style]}
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