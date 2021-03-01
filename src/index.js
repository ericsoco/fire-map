import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { devToolsEnhancer } from 'redux-devtools-extension';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import '~/node_modules/mapbox-gl/dist/mapbox-gl.css';

import rootReducer, { ROOT_STATE } from './state/root-reducer';
import { stateConfigs } from './constants';
import theme, { GlobalStyles } from './view/style/theme';
import App from './view/app';
import FourOhFour from './view/404';

const stateSanitizer = state => ({
  fires: {
    ...state.fires,
    years: Object.entries(state.fires.years).reduce((years, [year, value]) => {
      const sanitizedValue = Object.entries(value).reduce((acc, [k, v]) => {
        const data = v.data
          ? Object.keys(v.data).reduce((acc, k) => {
              acc[k] = `<<BLOB len:${v.data[k].length}>>`;
              return acc;
            }, {})
          : null;
        acc[k] = {
          ...v,
          ...(data ? { data } : {}),
        };
        return acc;
      }, {});
      years[year] = sanitizedValue;
      return years;
    }, {}),
  },
});

const store = createStore(
  rootReducer,
  ROOT_STATE,
  devToolsEnhancer({
    stateSanitizer,
  })
);

// Build regex for route matching that
// whitelists only states present in config
const supportedStates = Object.keys(stateConfigs).join('|');

// Set in .env files, statically replaced by Parcel
const basename = process.env.ASSET_PATH;
console.log({ basename });

render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <BrowserRouter basename={basename}>
        <Switch>
          <Route path={'/'} exact component={App} />
          <Route path={`/:stateCode(${supportedStates})`} component={App} />
          <Route component={FourOhFour} />
        </Switch>
      </BrowserRouter>
      <GlobalStyles />
    </ThemeProvider>
  </Provider>,
  document.getElementById('app')
);
