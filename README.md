react-history-query
-------------------

[![CircleCI](https://img.shields.io/circleci/project/github/BowlingX/react-history-query.svg?style=flat-square)](https://circleci.com/gh/BowlingX/react-history-query)
[![npm](https://img.shields.io/npm/v/react-history-query.svg?style=flat-square)](https://www.npmjs.com/package/react-history-query)

A simple HOC to connect component props to query parameters.

## Why?

It is often crucial to support restoring and syncing the state of an application trough query parameters.
Imagine large filters, tab states etc. Existing Routing solutions are often not enough or cumbersome to use when it comes to query parameters.
Additionally to that it should be easy to reason about what is synced.
Especially in large application it can be hard to keep track of all the parameters in the 
URL and how they are tide to components or what exactly they control.

This library provides a modular way to define props on components that should be synced as query-parameters.

It is working completely standalone and also great with `react-router`, `redux` and `redux-form`.

## Install

    npm install react-history-query
    
    //.. or with yarn
    
    yarn add react-history-query
    
## Requirements

- react 16.4. (uses new context API. please use 1.x for legacy support.)

## Usage

Use the `connectQueryToProps` HOC to provide the props you want to synchronize in the query parameters.
The first argument defines the namespace (similar to a form name in `redux-form`). 
The query parameters will be prefixed with `namespace.prop`.

The second argument is an object with the props to sync. It requires to implement three functions.

- `toQueryString`, used to serialize the given value. Return the serialized version (e.g. with `JSON.stringify`)
- `fromQueryString`, used to deserialize the value initially from the query string. Requires to return the unserialized value.
- `fromHistory`, called when navigating around (back and forward).
- `skip`, _optional_, return true to omit the property in the url based on the value.

`fromQueryString` and `fromHistory` give you access to the props that are passed to your component.
If you use e.g. `connect` from `redux` you could call dispatch or your custom action creators to synchronize the 
values with your global application state.
`redux-form` can easily be used too (see the examples).

### Example

```javascript
import { connectQueryToProps } from 'react-history-query';

let Component = () => { /*...*/ }

Component = connectQueryToProps('namespace' /* optional, pass undefined or null for global namespace */, {
  prop: {

      // called when property should be serialized to query param
      toQueryString: (value: any) => {
        return JSON.stringify(value);
      },
      // called initially before render
      fromQueryString: (value: any, props:Object) => {
        const newValue = JSON.parse(value);
        props.dispatch({ type: 'SET_VALUE', value: newValue });
        return newValue; // IMPORTANT: Always return the calculated value to prevent rerendering issues
      },
      // called if navigate and a certain state should be restored
      fromHistory: (value: any, props:Object) => {
        props.dispatch({ type: 'SET_VALUE', value });
      },
      // ..optional, return true to skip the parameter
      skip: (value, props: Object) => {
              
      }
  },
  secondProp: { /*...*/ }
} /*, false // set to true to make ref available with `getWrappedInstance`*/ )(Component);


// connect redux state..redux form etc.

```

Besides the connected component, we need a container that manages the query parameters.
It works similar to the Provider in `redux`. It accepts only a single child.

```javascript
import { QueryContainer } from 'react-history-query';
import createBrowserHistory from 'history/createBrowserHistory';
import App from './App';

const history= createBrowserHistory();

const Root = () => {
  return (
    <QueryContainer history={history}>
      <App/>
    </QueryContainer>
  );
};

```

## Dealing with State

You might want access to the current query parameters of a given namespace. This is what the `connectQuery` hoc is for.
It provides the following props:

- `queries` - the serialized queries for each namespace, let's you for example create a link with the current calculated state.

- `createQueryString(...namespaces)` - pass a list of `namespaces` as argument, e.g. `createQueryString('ns1', 'ns2')`.
It will generate the current query string for that.

- `persistCurrentState(namespace?: string)` - This will replace the initial state of the namespace with the current state.
This means, If you go back to any location where there are no / only partially query parameters for this namespace, it will load them
from this new initial state.

- `__unsafe__queryManager` - this will give you access to the query manager directly. 
Be careful what you do here, because it might break the state handling

## Server side rendering

Tested and working fine. Instead of `createBrowserHistory` use `createMemoryHistory` from the `history` package.

## Skip update cycle

You can pass a `skip` prop to `connectQueryToProps` and decide to skip a push completely on any update of props. 

    skip => (prevState: Object, nextState: Object): boolean

## Third party libraries

### react-router

Make sure you provide the same history instance to both `react-router` and `react-history-query`.

## Examples

Checkout the examples with `npm start` and `react-styleguidist`.

## Tests

...
