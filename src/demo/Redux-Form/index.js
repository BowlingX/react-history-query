/**
 * @flow
 */

import React from 'react';
import { Field, reduxForm, getFormValues } from 'redux-form';
import { connect } from 'react-redux';
import connectQueryToProps from '../../lib/ConnectQueryToProps';
import Root, { parameter } from '../shared/Root';

type Props = {
  checked: boolean,
  onChange: () => void,
  handleSubmit: () => void
};
// $FlowFixMe: ignore
const SimpleForm = (props: Props) => {
  const { handleSubmit } = props;
  return (
    <form onSubmit={handleSubmit}>
      <p>Please check</p>
      <Field name="checked" component="input" type="checkbox" />
      <Field name="text" component="input" type="text" />
      <button type="submit">Submit</button>
    </form>
  );
};

export const formCreator = (name) => {
  let Export = connectQueryToProps(name, {
    [`p.checked`]: parameter('checked'),
    [`p.text`]: parameter('text')
  })(SimpleForm);

  Export = reduxForm({
    // a unique name for the form
    form: name
  })(Export);

  Export = connect((state) => {
    const formValues = getFormValues(name)(state);
    return {
      [`p.checked`]: formValues ? formValues.checked || false : false,
      [`p.text`]: formValues ? formValues.text || '' : ''
    };
  })(Export);

  return Export;
};

const ReduxForm = () => {
  const CMP = formCreator('simple');
  return (
    <Root>
      <CMP />
    </Root>
  );
};

export default ReduxForm;
