/**
 * @flow
 */

import * as React from 'react';
import { createStore, combineReducers, compose } from 'redux';
import { reducer as formReducer } from 'redux-form';
import createHistory from 'history/createBrowserHistory';
import { Provider } from 'react-redux';
import QueryContainer from '../../lib/components/QueryContainer';

export const history = createHistory();

const store = createStore(
  combineReducers({
    form: formReducer
  }),
  {},
  compose(
    (typeof global.__REDUX_DEVTOOLS_EXTENSION__ !== 'undefined') ? global.__REDUX_DEVTOOLS_EXTENSION__() : f => f,
  )
);

export const parameter = (name:string) => ({
  // called during serialization
  toQueryString: (value: any) => {
    return JSON.stringify(value);
  },
  // called initially before render
  fromQueryString: (value: any, props:Object) => {
    const nextValue = JSON.parse(value);
    props.change(name, nextValue);
    return nextValue;
  },
  // called if navigate and a certain state should be restored
  fromHistory: (value: boolean, props:Object) => {
    props.change(name, value);
  }
});

const Root = (props:Object) => {
  return (
    <Provider store={store}>
      <QueryContainer history={history} {...props} />
    </Provider>
  );
};

export default Root;
