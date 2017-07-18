/**
 * @flow
 */
import React from 'react';
import Root, { parameter, history } from '../shared/Root';
import { BrowserRouter, Router, Link } from 'react-router-dom';
import { Route } from 'react-router';
import { formCreator } from '../Redux-Form/index';

const Form1 = formCreator('form1');

const FirstRoute = () => {
  return (
    <div>
      <h1>First-Route</h1>
      <Link to="/second">Go to second</Link>
      <Form1 />
    </div>
  );
};
const Form2 = formCreator('form2');

const SecondRoute = () => {
  return (
    <div>
      <h1>Second-Route</h1>
      <Link to="/first">Go to first</Link>
      <Form2 />
    </div>
  );
};

const ReactRouter = () => {
  return (
    <Root>
      <Router history={history}>
        <div>
          <Link to="/first">Go to first</Link>
          <Route path="/first" component={FirstRoute} />
          <Route path="/second" component={SecondRoute} />
        </div>
      </Router>
    </Root>
  );
};

export default ReactRouter;
