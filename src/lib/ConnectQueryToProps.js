/**
 * @flow
 */

import React, { Component } from 'react';
import type { ComponentType } from 'react';
import PropTypes from 'prop-types';
import shallowEqual from 'shallowequal';

const getOptionsFromProps = (options: Object, props: Object) => {
  return Object.keys(options).reduce(
    (next, prop) => ({ ...next, [prop]: props[prop] }), {}
  );
};

const connectQueryToProps =
  (namespace: string, options: Object, makeRefAvailable: boolean = false) => (InnerComponent: ComponentType<*>) => {
    return class extends Component<*, *> {
      static contextTypes = {
        queryManager: PropTypes.object
      };

      context: Object;

      innerComponentRef: ?Element;

      componentWillMount() {
        const state = this.context.queryManager.register(namespace, options, this.props);
        this.setState(state);
      }

      shouldComponentUpdate(nextProps: Object, nextState: Object) {
        return !shallowEqual(this.state, nextState);
      }

      componentDidUpdate(prevProps: Object, prevState: Object) {
        if (this.context.queryManager.isTransitioning()) {
          return;
        }
      // check if the parameters actually changed:
        if (!shallowEqual(
          getOptionsFromProps(options, prevState),
          getOptionsFromProps(options, this.state))
      ) {
          this.context.queryManager.pushChanges(namespace, this.state);
        }
      }

      componentWillReceiveProps(props: Object) {
        this.context.queryManager.updateProps(namespace, props);
        this.setState(props);
      }

      componentWillUnmount() {
        if (this.context.queryManager) {
          this.context.queryManager.unregister(namespace);
        }
      }

      getWrappedInstance() {
        return this.innerComponentRef;
      }

      render() {
        const additionalProps = makeRefAvailable ?
          { ref: (instance) => { this.innerComponentRef = instance; } } : {};
        return <InnerComponent {...additionalProps} {...this.state} />;
      }
  };
  };

export default connectQueryToProps;
