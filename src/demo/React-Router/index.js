/**
 * @flow
 */
import * as React from 'react';
import { Router, Link, Route } from 'react-router-dom';
import Root, { history } from '../shared/Root';
import { formCreator } from '../Redux-Form/index';

const Form1 = formCreator('form1', null);

const FirstRoute = () => {
  return (
    <div>
      <h1>First-Route</h1>
      <Link to="/second">Go to second</Link>
      <Form1 />
    </div>
  );
};
const Form2 = formCreator('form2', 'form2');

const SecondRoute = () => {
  return (
    <div>
      <h1>Second-Route</h1>
      <Link to="/first?p.checked=true">Go to first</Link>
      <br />
      <Link to='/second?form2.p.checked=true&form2.p.text="initialText"'>Set some defaults</Link>
      <Form2 />
    </div>
  );
};

const ReactRouter = () => {
  return (
    <Root>
      { /* $FlowFixMe: history and router incompatible */}
      <Router history={history}>
        <div>
          <Link to="/first">Open initial</Link>
          <Route path="/first" component={FirstRoute} />
          <Route path="/second" component={SecondRoute} />
        </div>
      </Router>
    </Root>
  );
};

export default ReactRouter;
