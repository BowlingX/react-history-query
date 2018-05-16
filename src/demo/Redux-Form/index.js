/**
 * @flow
 */

import * as React from 'react';
import { Field, reduxForm, getFormValues } from 'redux-form';
import { connect } from 'react-redux';
import connectQueryToProps from '../../lib/connectQueryToProps';
import Root, { parameter } from '../shared/Root';

type Props = {
  checked: boolean,
  onChange: () => void,
  handleSubmit: () => void
};

class SimpleForm extends React.Component<Props> { // eslint-disable-line
  render() {
    const { handleSubmit } = this.props;
    return (
      <form onSubmit={handleSubmit}>
        <p>Please check</p>
        <Field name="checked" component="input" type="checkbox" />
        <Field name="text" component="input" type="text" />
        <button type="submit">Submit</button>
      </form>
    );
  }
}

export const formCreator = (name:string) => {
  let Export = connectQueryToProps(name, {
    [`p.checked`]: parameter('checked'),
    [`p.text`]: parameter('text')
  })(SimpleForm);

  Export = reduxForm({
    // a unique name for the form
    form: name
  })(Export);

  Export = connect((state) => {
    const initialValues = {
      checked: false,
      text: ''
    };
    const formValues = getFormValues(name)(state) || initialValues;
    return {
      initialValues,
      [`p.checked`]: formValues.checked || false,
      [`p.text`]: formValues.text
    };
  }, {})(Export);

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
