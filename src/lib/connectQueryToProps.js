/**
 * @flow
 */

import React, { Component } from 'react';
import type { ComponentType } from 'react';
import shallowEqual from 'shallowequal';
import { QueryManagerContext } from './components/QueryContainer';

const getOptionsFromProps = (options: Object, props: Object) => {
  return Object.keys(options).reduce(
    (next, prop) => ({ ...next, [prop]: props[prop] }), {}
  );
};

const connectQueryToProps =
  (thisNamespace: ?string, options: Object, makeRefAvailable: boolean = false) =>
    (InnerComponent: ComponentType<*>) => {
      const namespace = thisNamespace || undefined;
      class ConnectQueryHoc extends Component<*, *> {

        innerComponentRef: ?Element;

        state = {}

        constructor(props:*) {
          super(props);
          this.state = this.props.queryManager.register(namespace, options, props);
        }

        componentWillMount() {
          this.props.queryManager.registerMount(namespace);
        }

        shouldComponentUpdate(nextProps: Object, nextState: Object) {
          return !shallowEqual(this.state, nextState);
        }

        componentDidUpdate(prevProps: Object, prevState: Object) {
          if (this.props.queryManager.isTransitioning()) {
            return;
          }
        // check if the parameters actually changed:
          if (!shallowEqual(
          getOptionsFromProps(options, prevState),
          getOptionsFromProps(options, this.state))
      ) {
            this.props.queryManager.pushChanges(namespace, this.state);
          }
        }

      UNSAFE_componentWillReceiveProps(props: Object) { // eslint-disable-line
        this.props.queryManager.updateProps(namespace, props);
        this.setState(props);
      }

        componentWillUnmount() {
          if (this.props.queryManager) {
            this.props.queryManager.unregister(namespace);
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
  }
      const WithQueryManager = (props: Object) => (
        <QueryManagerContext.Consumer>
          {queryManagerContext => (
            queryManagerContext && <ConnectQueryHoc queryManager={queryManagerContext.queryManager} {...props} />
      )}
        </QueryManagerContext.Consumer>
  );
      return WithQueryManager;
    };


export default connectQueryToProps;
