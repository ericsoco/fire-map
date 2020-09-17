import { createGlobalStyle } from 'styled-components';
import reset from './reset';

export const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css?family=Lato&display=fallback');
  ${reset}
  body {
    font-family: 'Lato', sans-serif;
  }
`;

/**
 * Usage:
 * styled.div`
 *   ${p => p.theme.mixins.h1};
 *   ...other styles...
 * `
 */
const mixins = {
  h1: {
    'font-size': '2rem',
  },
};

export default {
  color: 'mediumseagreen',
  mixins,
};

export const colors = {
  FIRE: [255, 80, 60],
  SLIDER: [235, 146, 103],
};
