import { darken, readableColor, transparentize } from 'polished';
import styled, { css } from 'styled-components';

const brandColors = [
  'default',
  'primary',
  'success',
  'info',
  'warning',
  'danger',
] as const;

type Color = (typeof brandColors)[number];

export type ColorProps = {
  color?: Color;
  theme: {
    brand: Record<Color, string>;
  };
} & Partial<Record<Color, boolean>>;

export const propsColor = (props: ColorProps): string | null =>
  props.color
    ? brandColors.includes(props.color)
      ? props.theme.brand[props.color]
      : props.color
    : brandColors.reduceRight<string | false | undefined>(
        (prev, c) => prev || (props[c] && props.theme.brand[c]),
        false,
      ) || null;

interface Props extends ColorProps {
  iconSize?: number | string;
  lgPad?: boolean;
  mdPad?: boolean;
  pad?: 'sm' | 'md' | 'lg' | number | string;
  radius?: number | string;
  raised?: boolean;
  size?: number | string;
  smPad?: boolean;
  text?: boolean;
  textColor?: string;
}

const IconButton = styled.button<Props>`
  flex: 0 0 auto;
  color: ${(props) =>
    props.textColor ||
    transparentize(0.2, readableColor(propsColor(props) || '#fff'))};
  padding: ${({ lgPad, mdPad, pad, smPad }) =>
    pad === 'sm' || !!smPad
      ? '.25em'
      : pad === 'md' || !!mdPad
      ? '.40em'
      : pad === 'lg' || !!lgPad
      ? '.55em'
      : typeof pad === 'number'
      ? `${pad}px`
      : pad};
  overflow: visible;
  font-size: ${({ size }) =>
    typeof size === 'number' ? `${size}px` : size || '1.5rem'};
  line-height: 1em;
  text-align: center;
  transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  border-radius: ${({ radius, text }) =>
    typeof radius === 'number'
      ? `${radius}px`
      : radius || (text ? '10px' : '50%')};
  background-color: ${(props) => propsColor(props) || 'transparent'};

  ${({ raised }) =>
    raised
      ? css`
          box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
            0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
          transition: box-shadow 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        `
      : ''}

  &:hover {
    background-color: ${(props) =>
      darken(0.1, propsColor(props) || 'rgba(0, 0, 0, 0.08)')};
    color: ${(props) =>
      props.textColor ||
      transparentize(
        0.3,
        readableColor(darken(0.1, propsColor(props) || '#fff')),
      )};
    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2),
      0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);
  }

  &[disabled] {
    color: rgba(0, 0, 0, 0.26);
    background-color: ${(props) =>
      propsColor(props) ? 'rgba(0, 0, 0, 0.03)' : 'transparent'};
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.2), 0 0 0 0 rgba(0, 0, 0, 0.14),
      0 0 0 0 rgba(0, 0, 0, 0.12);
    cursor: default;
    pointer-events: none;
  }

  border: 0;
  margin: 0;
  cursor: pointer;
  display: inline-flex;
  outline: none;
  position: relative;
  align-items: center;
  user-select: none;
  vertical-align: middle;
  justify-content: center;
  text-decoration: none;
  -webkit-appearance: none;
  -webkit-tap-highlight-color: transparent;

  > i {
    font-size: ${({ iconSize }) =>
      typeof iconSize === 'number' ? `${iconSize}px` : iconSize || '1.4em'};
    width: 1.45em;
    height: 1.45em;
    line-height: 1.45em;
  }
`;

export default IconButton;
