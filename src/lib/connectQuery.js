/**
 * @flow
 */

import React, { PureComponent } from 'react';
import type { ComponentType } from 'react';
import { QueryManagerContext } from './components/QueryContainer';
import type { QueryManagerContextType } from "./components/QueryContainer";
import { QueryContext } from "./connectQueryToProps";

const connectQuery =
  (makeRefAvailable: boolean = false) => (InnerComponent: ComponentType<*>) => {
    return class extends PureComponent<*, *> {

      innerComponentRef: ?Element;

      render() {
        return (
          <QueryManagerContext.Consumer>
            {(queryManagerContext: QueryManagerContextType) => {
              const additionalProps = makeRefAvailable ?
              { ref: (instance) => { this.innerComponentRef = instance; } } : {};
              return (
                <QueryContext.Consumer>
                  {queries => (
                    //  $FlowFixMe: ignore
                    <InnerComponent
                      queries={queries}
                      createQueryString={queryManagerContext.queryManager.createQueryString}
                      persistCurrentState={queryManagerContext.queryManager.persistCurrentState}
                      __unsafe__queryManager={queryManagerContext.queryManager}
                      {...this.props}
                      {...additionalProps}
                    />
                  )}
                </QueryContext.Consumer>
              );
            }}
          </QueryManagerContext.Consumer>
        );
      }
    };
  };

export default connectQuery;
