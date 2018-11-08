/**
 * @flow
 */

import React, { Component } from 'react';
import type { ComponentType, Context } from 'react';
import shallowEqual from 'shallowequal';
import { DEFAULT_NAMESPACE, QueryManagerContext } from './components/QueryContainer';

const getOptionsFromProps = (options: Object, props: Object) => {
  return Object.keys(options).reduce(
    (next, prop) => ({ ...next, [prop]: props[prop] }), {}
  );
};

export const QueryContext: Context<Object> = React.createContext({});

const connectQueryToProps =
  (thisNamespace: ?string, options: Object, makeRefAvailable: boolean = false) =>
    (InnerComponent: ComponentType<*>) => {
      const namespace = thisNamespace || undefined;
      const normalizedNamespace = namespace || DEFAULT_NAMESPACE;

      class ConnectQueryHoc extends Component<*, *> {

        innerComponentRef: ?Element;

        componentWillMount() {
          const { state, serialized } = this.props.queryManager.register(namespace, options, this.props);
          this.setState({ state, serialized });
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
          getOptionsFromProps(options, prevState.state),
          getOptionsFromProps(options, this.state.state))
      ) {
            this.props.queryManager.pushChanges(namespace, this.state.state);
          }
        }

      UNSAFE_componentWillReceiveProps(props: Object) { // eslint-disable-line
        this.props.queryManager.updateProps(namespace, props);
        this.setState({ state: props });
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
          const queryData = this.props.queries[normalizedNamespace] || this.state.serialized;
          return (
            <QueryContext.Consumer>
              {(queries: Object) => (
                <QueryContext.Provider value={{ ...queries, [normalizedNamespace]: queryData }}>
                  <InnerComponent {...additionalProps} {...this.state.state} />
                </QueryContext.Provider>
              )}
            </QueryContext.Consumer>
          );
        }
  }
      const WithQueryManager = (props: Object) => (
        <QueryManagerContext.Consumer>
          {queryManagerContext => (
            <ConnectQueryHoc
              queries={queryManagerContext.queries}
              queryManager={queryManagerContext.queryManager}
              {...props}
            />
      )}
        </QueryManagerContext.Consumer>
  );
      return WithQueryManager;
    };


export default connectQueryToProps;
