import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import initialState from './state';
import rootReducer from './state/root-reducer';
import App from './views/app';
import FourOhFour from './views/404';

const store = createStore(rootReducer, initialState);

render(
  <Provider store={store}>
    <BrowserRouter>
      <Switch>
        <Route path={ '/' } exact component={ App } />
        <Route component={ FourOhFour } />
      </Switch>
    </BrowserRouter>
  </Provider>,
  document.getElementById('app')
);
