import type { DefaultTheme } from 'styled-components';

export const brandColors = [
  'black',
  'white',
  'primary',
  'success',
  'info',
  'warning',
  'danger',
] as const;

export type BrandColor = (typeof brandColors)[number];

export const gameColors = [
  'cardDark',
  'cardLight',
  'portraitBackground',
  'portraitBorder',
  'portraitBystander',
  'portraitUnknown',
  'spyBlack',
  'spyBlue',
  'spyRed',
] as const;

export type GameColor = (typeof gameColors)[number];

export const screenSizes = [
  'lgMin',
  'lgMinHt',
  'mdMax',
  'mdMin',
  'mdMinHt',
  'smMax',
  'smMin',
  'smMinHt',
  'xsMax',
];

export type ScreenSize = (typeof screenSizes)[number];

export interface Theme extends DefaultTheme {
  brand: Record<BrandColor, string>;
  game: Record<GameColor, string>;
  screen: Record<ScreenSize, string>;
}
