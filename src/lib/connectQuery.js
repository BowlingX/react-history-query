/**
 * @flow
 */

import React, { Component } from 'react';
import type { ComponentType } from 'react';
import { QueryManagerContext } from './components/QueryContainer';
import type { QueryManager } from "./components/QueryContainer";

const connectQuery =
  (makeRefAvailable: boolean = false) => (InnerComponent: ComponentType<*>) => {
    return class extends Component<*, *> {

      innerComponentRef: ?Element;

      render() {
        return (
          <QueryManagerContext.Consumer>
            {(queryManager: ?QueryManager) => {
              const additionalProps = makeRefAvailable ?
              { ref: (instance) => { this.innerComponentRef = instance; } } : {};
              return queryManager && (
                <InnerComponent
                  createQueryString={queryManager.createQueryString}
                  persistCurrentState={queryManager.persistCurrentState}
                  __unsafe__queryManager={queryManager}
                  {...this.props}
                  {...additionalProps}
                />
              );
            }}
          </QueryManagerContext.Consumer>
        );
      }
    };
  };

export default connectQuery;
