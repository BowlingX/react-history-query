/**
 * @flow
 */

import React from 'react';
import createHistory from 'history/createBrowserHistory';
import QueryContainer from '../QueryContainer';

const history = createHistory();

describe('<QueryContainer/>', () => {
  it('should render a connected component', () => {
    const app = (
      <QueryContainer history={history}>
        <div>App</div>
      </QueryContainer>
    );
  });
});