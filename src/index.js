import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { devToolsEnhancer } from 'redux-devtools-extension';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import rootReducer, { ROOT_STATE } from './state/root-reducer';
import theme, { GlobalStyles } from './view/style/theme';
import App from './view/app';
import FourOhFour from './view/404';

const store = createStore(rootReducer, ROOT_STATE, devToolsEnhancer());

render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Switch>
          <Route path={'/'} exact component={App} />
          <Route component={FourOhFour} />
        </Switch>
      </BrowserRouter>
      <GlobalStyles />
    </ThemeProvider>
  </Provider>,
  document.getElementById('app')
);
