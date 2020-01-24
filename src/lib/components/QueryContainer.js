/**
 *@flow
 */

import React, { PureComponent } from 'react'
import type { Node, Context } from 'react'
import queryString from 'query-string'
import { createSelector } from 'reselect'
import createCachedSelector from 're-reselect'
import shallowEqual from 'shallowequal'

type QueryContainerProps = {
  history: Object,
  children: Node
}

export type QueryManager = {
  pushChanges: Function,
  updateProps: Function,
  register: Function,
  persistCurrentState: Function,
  createQueryString: Function,
  unregister: Function,
  isTransitioning: Function
}

export type QueryManagerContextType = {
  queryManager: QueryManager,
  queries: Object
}

export const QueryManagerContext: Context<?QueryManagerContextType> = React.createContext()

export const DEFAULT_NAMESPACE = '__d'

export const createQueryString = (components: Object, ...namespaces: Array<?string>) => {
  return namespaces.filter(n => components[n]).map(key => {
    return queryString.stringify(components[key || DEFAULT_NAMESPACE])
  }).filter(s => s && s.length > 0).join('&')
}

type State = {
  persistedComponents: Object
}

const keySelector = state => state.key
const valueSelector = state => state.value
const propsSelector = state => state.props

const createOptionsSelector = (options: Object, namespace: string) => createCachedSelector(
  keySelector, valueSelector, propsSelector, (key, value, thisProps) => {
    return !(options[key].skip && options[key].skip(value, thisProps)) ? {
      [QueryContainer.formatNamespace(namespace, key)]: options[key].toQueryString(value)
    } : {}
  })((state, key) => key)

export default class QueryContainer extends PureComponent<QueryContainerProps, State> {
  listener: ?Function;

  components: Object = {};

  initialParsedQuery: (location: Object) => Object;

  isTransitioning: boolean = false;

  namespaceGc = {}

  queryManager: Object

  state = {
    persistedComponents: {}
  }

  constructor(props: QueryContainerProps) {
    super(props)
    const searchSelector = location => location.search
    this.initialParsedQuery =
    createSelector(searchSelector, search => queryString.parse(search))
    this.queryManager = this.initQueryManager()
  }

  static formatNamespace(ns: ?string, key: string) {
    return ns && ns !== DEFAULT_NAMESPACE ? `${ns}.${key}` : key
  }

  /*
   * Handles external push events
   */
  handleQueryChange() {
    this.isTransitioning = true
    const parsedQuery = this.initialParsedQuery(this.props.history.location)
    // we skip one cycle to support proper handling of route switches / prop updates in fromHistory
    requestAnimationFrame(() => {
      Object.keys(this.components).forEach(cmp => {
        const { blankState, options, props, state } = this.components[cmp]
        const serialized = {}
        const nextState = Object.keys(options).reduce((initial, optionKey) => {
          const queryValue = parsedQuery[QueryContainer.formatNamespace(cmp, optionKey)]
          const blankStateValue = blankState[optionKey]
          let newState = blankStateValue
          if (queryValue !== undefined) {
            newState = options[optionKey].fromQueryString(queryValue, props)
            serialized[QueryContainer.formatNamespace(cmp, optionKey)] = queryValue
          } else if (blankStateValue !== undefined) {
            const oldValue = state[optionKey]
            if (!shallowEqual(oldValue, blankStateValue)) {
              options[optionKey].fromHistory(blankStateValue, props)
            }
          }
          initial[optionKey] = newState
          return initial
        }, {})
        this.components[cmp] = { ...this.components[cmp], state: nextState, serialized }
      })

      this.refreshState()
      this.isTransitioning = false
    })
  }

  refreshState() {
    this.setState({ persistedComponents: Object.keys(this.components).reduce((previous, next) => {
      return {
        ...previous,
        [next]: this.components[next].serialized
      }
    }, {}) })
  }

  componentDidMount() {
    const { history } = this.props
    this.listener = history.listen(({ location, action }) => {
      const historyState = location.state && location.state.__componentState
      // do not react to our own events:
      if (
        (action === 'REPLACE' || action === 'PUSH') &&
        historyState
      ) {
        return
      }
      if (action === 'PUSH' && !historyState) {
        this.handleQueryChange()
        return
      }
      if (action !== 'POP') {
        return
      }
      this.handleQueryChange()
    })
  }

  calculateQueryString() {
    return `?${Object.keys(this.components).map(key => {
      return queryString.stringify(this.components[key].serialized)
    }).filter(s => s && s.length > 0).join('&')}`
  }

  initQueryManager(): QueryManager {
    return {
      pushChanges: (namespace: string = DEFAULT_NAMESPACE, props: Object) => {
        const options = this.components[namespace].options
        const optionsSelector = this.components[namespace].optionsSelector
        const next = Object.keys(options).reduce((initial, key) => {
          const value = props[key]
          if (value !== undefined) {
            const nextValue = optionsSelector({ key, value, props }, key)
            return {
              state: { ...initial.state, [key]: value },
              serialized: {
                ...initial.serialized,
                ...nextValue
              }
            }
          }
          return initial
        }, {
          state: {},
          serialized: {}
        })
        this.components[namespace] = { ...this.components[namespace], ...next }

        this.props.history.push(
          { pathname: location.pathname, search: this.calculateQueryString() },
          { __componentState: true }
        )

        this.updateState(namespace, next.serialized)
      },
      updateProps: (namespace: string = DEFAULT_NAMESPACE, props: Object) => {
        this.components[namespace] = { ...this.components[namespace], props }
      },
      register: (namespace: string = DEFAULT_NAMESPACE, options: Object, props: Object) => {
        if (this.components[namespace]) {
          this.namespaceGc[namespace] += 1
        }
        const optionsSelector = createOptionsSelector(options, namespace)
        // blank state = state without query parameters applied
        const blankState = {}
        // initial state = state with queryParameters applied (or not if not set)
        const initialState = {}
        // serialized query parameter state
        const serialized = {}
        const state = Object.keys(options).reduce((initial: Object, key: string) => {
          const initialQueryValue = this.initialParsedQuery(this.props.history.location)[
            QueryContainer.formatNamespace(namespace, key)
          ]
          if (props[key] !== undefined) {
            blankState[key] = props[key]
            initialState[key] = props[key]
          }
          if (initialQueryValue !== undefined) {
            const value = options[key].fromQueryString(initialQueryValue, props)
            initialState[key] = value
            serialized[QueryContainer.formatNamespace(namespace, key)] = initialQueryValue
            return { ...initial, [key]: value }
          }
          return initial
        }, props)
        this.components[namespace] = {
          options, props, optionsSelector, blankState, state: initialState, serialized
        }
        if (!this.namespaceGc[namespace]) {
          this.namespaceGc[namespace] = 1
        }

        this.updateState(namespace, serialized)

        return { state, serialized }
      },
      /* will replace the blank state with the current state */
      persistCurrentState: (namespace: string = DEFAULT_NAMESPACE): boolean => {
        if (!this.components[namespace]) {
          return false
        }
        this.components[namespace].blankState = this.components[namespace].state
        return true
      },
      /* generates the query string for the given namespace(s) */
      createQueryString: (...namespaces: Array<string>) => {
        return createQueryString(this.state.persistedComponents, ...namespaces)
      },
      unregister: (namespace: string = DEFAULT_NAMESPACE) => {
        this.namespaceGc[namespace] -= 1
        if (this.namespaceGc[namespace] === 0) {
          if (this.components[namespace] !== undefined) {
            this.components[namespace].optionsSelector.clearCache()
            delete this.components[namespace]
          }
          delete this.namespaceGc[namespace]
        }
        const { [namespace]: value, ...rest } = this.state.persistedComponents // eslint-disable-line
        this.setState({ persistedComponents: rest })
      },
      isTransitioning: () => this.isTransitioning
    }
  }

  updateState(ns: string, serialized: Object) {
    const persistedComponents = this.state.persistedComponents
    this.setState({ persistedComponents: { ...persistedComponents, [ns]: serialized } })
  }

  componentWillUnmount() {
    if (this.listener) {
      this.listener()
    }
    this.components = {}
    this.isTransitioning = false
  }

  render() {
    const { children } = this.props
    const { persistedComponents } = this.state
    return (
      <QueryManagerContext.Provider value={{ queryManager: this.queryManager, queries: persistedComponents }}>
        {children}
      </QueryManagerContext.Provider>
    )
  }
}
