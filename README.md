react-history-query
-------------------

A simple HOC to connect component props to query parameters.

## Usage

```javascript
import { connectQueryToProps } from 'react-history-query';

let Component = () => { /*...*/ }

Component = connectQueryToProps({
  prop: {
      // called when property should be serialized to query param
      toQueryString: (value: any) => {
        
      },
      // called initially before render
      fromQueryString: (value: any, props:Object) => {
        
      },
      // called if navigate and a certain state should be restored
      fromHistory: (value: boolean, props:Object) => {
      }
  } 
})(Component);


// connect redux state..redux form etc.

```

Checkout the examples with `npm start` and `react-styleguidist`.