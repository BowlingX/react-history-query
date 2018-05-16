/**
 * @flow
 */

import React, { Component } from 'react';
import type { ComponentType } from 'react';
import PropTypes from 'prop-types';

const connectQuery =
  (makeRefAvailable: boolean = false) => (InnerComponent: ComponentType<*>) => {
    return class extends Component<*, *> {
      static contextTypes = {
        queryManager: PropTypes.object
      };

      innerComponentRef: ?Element;

      render() {
        const { queryManager } = this.context;
        const additionalProps = makeRefAvailable ?
          { ref: (instance) => { this.innerComponentRef = instance; } } : {};
        return (
          <InnerComponent
            createQueryString={queryManager.createQueryString}
            persistCurrentState={queryManager.persistCurrentState}
            __unsafe__queryManager={queryManager}
            {...this.props}
            {...additionalProps}
          />
        );
      }
    };
  };

export default connectQuery;
