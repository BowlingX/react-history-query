/**
 * @flow
 */

import React, { Component, useContext, useMemo, memo } from 'react'
import type { ComponentType, Context } from 'react'
import shallowEqual from 'shallowequal'
import { DEFAULT_NAMESPACE, QueryManagerContext } from './components/QueryContainer'

const getOptionsFromProps = (options: Object, props: Object) => {
  return Object.keys(options).reduce(
    (next, prop) => ({ ...next, [prop]: props[prop] }), {}
  )
}

export const QueryContext: Context<Object> = React.createContext({})

type InnerQueryWrapperProps = {
  queryData: Object,
  normalizedNamespace: string,
  innerState: Object,
  innerComponent: ComponentType<*>,
  additionalProps: Object
}

function InnerQueryWrapper({
  queryData,
  normalizedNamespace,
  innerComponent: InnerComponent,
  ...rest
}: InnerQueryWrapperProps) {
  const queries = useContext(QueryContext)
  const value = useMemo(() => {
    return { ...queries, [normalizedNamespace]: queryData }
  }, [ queries, queryData, normalizedNamespace ])
  return (
    <QueryContext.Provider value={value}>
      <InnerComponent {...rest} />
    </QueryContext.Provider>
  )
}

const MemoizedInnerQueryWrapper = memo(InnerQueryWrapper)

const connectQueryToProps =
  (thisNamespace: ?string, options: Object, makeRefAvailable: boolean = false) =>
    (InnerComponent: ComponentType<*>) => {
      const namespace = thisNamespace || undefined
      const normalizedNamespace = namespace || DEFAULT_NAMESPACE

      class ConnectQueryHoc extends Component<*, *> {
        innerComponentRef: ?ComponentType<*>;

        componentWillMount() {
          const { state, serialized } = this.props.queryManager.register(namespace, options, this.props)
          this.setState({ state, serialized })
        }

        shouldComponentUpdate(nextProps: Object, nextState: Object) {
          return !shallowEqual(this.state, nextState)
        }

        componentDidUpdate(prevProps: Object, prevState: Object) {
          if (this.props.queryManager.isTransitioning()) {
            return
          }

          if (typeof this.props.skip === 'function' && this.props.skip(prevState.state, this.state.state)) {
            return
          }
          // check if the parameters actually changed:
          if (!shallowEqual(
            getOptionsFromProps(options, prevState.state),
            getOptionsFromProps(options, this.state.state))
          ) {
            this.props.queryManager.pushChanges(namespace, this.state.state)
          }
        }

        UNSAFE_componentWillReceiveProps(props: Object) { // eslint-disable-line
          this.props.queryManager.updateProps(namespace, props)
          this.setState({ state: props })
        }

        componentWillUnmount() {
          if (this.props.queryManager) {
            this.props.queryManager.unregister(namespace)
          }
        }

        getWrappedInstance() {
          return this.innerComponentRef
        }

        calcRef = (instance: ?ComponentType<*>) => {
          this.innerComponentRef = instance
        }

        render() {
          const additionalProps = makeRefAvailable ?
            { ref: this.calcRef } : {}
          const queryData = this.props.queries[normalizedNamespace] || this.state.serialized
          return (
            <MemoizedInnerQueryWrapper
              innerComponent={InnerComponent}
              normalizedNamespace={normalizedNamespace}
              queryData={queryData}
              {...additionalProps}
              {...this.state.state}
            />
          )
        }
      }
      const WithQueryManager = (props: Object) => (
        <QueryManagerContext.Consumer>
          {queryManagerContext => (
            queryManagerContext &&
            <ConnectQueryHoc
              queries={queryManagerContext.queries}
              queryManager={queryManagerContext.queryManager}
              {...props}
            />
          )}
        </QueryManagerContext.Consumer>
      )
      return WithQueryManager
    }


export default connectQueryToProps
