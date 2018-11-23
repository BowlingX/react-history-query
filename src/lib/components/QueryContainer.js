/**
 *@flow
 */

import React, { PureComponent } from 'react';
import type { Node, Context } from 'react';
import queryString from 'query-string';
import { createSelector } from 'reselect';
import createCachedSelector from 're-reselect';
import shallowEqual from 'shallowequal';

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

export const QueryManagerContext: Context<?QueryManagerContextType> = React.createContext();

export const DEFAULT_NAMESPACE = '__d';

export const createQueryString = (components: Object, ...namespaces: Array<?string>) => {
  return namespaces.filter(n => components[n]).map((key) => {
    return queryString.stringify(components[key || DEFAULT_NAMESPACE]);
  }).filter(s => s && s.length > 0).join('&');
};

type State = {
  persistedComponents: Object
}

export default class QueryContainer extends PureComponent<QueryContainerProps, State> {
  listener: ?Function;

  components: Object = {};

  initialParsedQuery: (location:Object) => Object;

  isTransitioning: boolean = false;

  namespaceGc = {}

  queryManager: Object

  state = {
    persistedComponents: {}
  }

  constructor(props: QueryContainerProps) {
    super(props);
    const searchSelector = location => location.search;
    this.initialParsedQuery =
    createSelector(searchSelector, search => queryString.parse(search));
    this.queryManager = this.initQueryManager();
  }

  static formatNamespace(ns:?string, key:string) {
    return ns && ns !== DEFAULT_NAMESPACE ? `${ns}.${key}` : key;
  }

  /**
   * Handles external push events
   */
  handlePush(previousState:Object) {
    this.isTransitioning = true;
    const parsedQuery = this.initialParsedQuery(this.props.history.location);
    // we skip one cycle to support proper handling of route switches / prop updates in fromHistory
    requestAnimationFrame(() => {
      Object.keys(this.components).forEach((cmp) => {
        const { blankState, options, props, state } = this.components[cmp];
        const serialized = {};
        const nextState = Object.keys(options).reduce((initial, optionKey) => {
          const queryValue = parsedQuery[QueryContainer.formatNamespace(cmp, optionKey)];
          const blankStateValue = blankState[optionKey];
          let newState = blankStateValue;
          if (queryValue !== undefined) {
            newState = options[optionKey].fromQueryString(queryValue, props);
            serialized[QueryContainer.formatNamespace(cmp, optionKey)] = queryValue;
          } else if (blankStateValue !== undefined) {
            const oldValue = state[optionKey];
            if (!shallowEqual(oldValue, blankStateValue)) {
              options[optionKey].fromHistory(blankStateValue, props);
            }
          }
          initial[optionKey] = newState;
          return initial;
        }, {});
        this.components[cmp] = { ...this.components[cmp], state: nextState, serialized };
      });
      this.props.history.replace({
        ...this.props.history.location,
        state: { ...previousState, __componentState: this.currentComponentState() }
      });
      this.refreshState();
      this.isTransitioning = false;
    });
  }

  handlePop(previousState:Object) {
    this.isTransitioning = true;
    Object.keys(previousState).forEach((key) => {
      if (this.components[key]) {
        Object.keys(previousState[key]).forEach((propKey) => {
          const oldValue = previousState[key][propKey];
          if (oldValue === undefined || (!shallowEqual(oldValue, this.components[key].state[propKey]))) {
            this.components[key].options[propKey].fromHistory(
              oldValue, this.components[key].props);
            // mutate current state with old value,
            // this way we can only call fromHistory where required
            this.components[key].state[propKey] = oldValue;
            // mutate current serialized value
            const nextPropValue = this.components[key].optionsSelector({ key: propKey, value: oldValue }, propKey);
            const nsKey = QueryContainer.formatNamespace(key, propKey);
            if (!nextPropValue[nsKey]) { // if value was empty we remove the current value
              delete this.components[key].serialized[nsKey];
            } else {
              this.components[key].serialized = {
                ...this.components[key].serialized,
                ...nextPropValue
              };
            }
          }
        });
      }
    });
    // recalculate serialized state
    this.refreshState();
    this.isTransitioning = false;
  }

  refreshState() {
    this.setState({ persistedComponents: Object.keys(this.components).reduce((previous, next) => {
      return {
        ...previous,
        [next]: this.components[next].serialized
      };
    }, {}) });
  }

  componentDidMount() {
    const { history } = this.props;
    // save initial state
    history.replace(
      { ...history.location,
        state: { ...history.location.state, __componentState: this.currentComponentState(), isInitial: true }
      }
      );
    this.listener = history.listen((location, action) => {
      const historyState = location.state && location.state.__componentState;
      // react to external events
      if (action === 'PUSH' && !historyState) {
        this.handlePush(location.state);
        return;
      }
      const previousState = historyState ?
        location.state.__componentState : this.blankComponentState();
      if (action !== 'POP' || !previousState) {
        return;
      }
      this.handlePop(previousState);
    });
  }

  currentComponentState() {
    return Object.keys(this.components).reduce((initial, key) => ({
      ...initial,
      [key]: this.components[key].state
    }), {});
  }

  blankComponentState() {
    return Object.keys(this.components).reduce((initial, key) => ({
      ...initial,
      [key]: this.components[key].blankState
    }), {});
  }

  calculateQueryString() {
    return Object.keys(this.components).map((key) => {
      return queryString.stringify(this.components[key].serialized);
    }).filter(s => s && s.length > 0).join('&');
  }

  initQueryManager(): QueryManager {
    return {
      pushChanges: (namespace: string = DEFAULT_NAMESPACE, props: Object) => {
        const options = this.components[namespace].options;
        const optionsSelector = this.components[namespace].optionsSelector;
        const next = Object.keys(options).reduce((initial, key) => {
          const value = props[key];
          if (value !== undefined) {
            const nextValue = optionsSelector({ key, value }, key);
            return {
              state: { ...initial.state, [key]: value },
              serialized: {
                ...initial.serialized,
                ...nextValue
              }
            };
          }
          return initial;
        }, {
          state: {},
          serialized: {}
        });
        this.components[namespace] = { ...this.components[namespace], ...next };
        this.props.history.push(
            { pathname: location.pathname, search: this.calculateQueryString() },
            { __componentState: this.currentComponentState() }
          );
        this.updateState(namespace, next.serialized);
      },
      updateProps: (namespace: string = DEFAULT_NAMESPACE, props:Object) => {
        this.components[namespace] = { ...this.components[namespace], props };
      },
      register: (namespace: string = DEFAULT_NAMESPACE, options: Object, props: Object) => {
        if (this.components[namespace]) {
          this.namespaceGc[namespace] += 1;
        }
        const keySelector = state => state.key;
        const valueSelector = state => state.value;
        const optionsSelector = createCachedSelector(keySelector, valueSelector, (key, value) => {
          return !(options[key].skip && options[key].skip(value, props)) ? {
            [QueryContainer.formatNamespace(namespace, key)]: options[key].toQueryString(value)
          } : {};
        })((state, key) => key);
          // blank state = state without query parameters applied
        const blankState = {};
          // initial state = state with queryParameters applied (or not if not set)
        const initialState = {};
          // serialized query parameter state
        const serialized = {};
        const state = Object.keys(options).reduce((initial, key) => {
          const initialQueryValue = this.initialParsedQuery(this.props.history.location)[
            QueryContainer.formatNamespace(namespace, key)
            ];
          if (props[key] !== undefined) {
            blankState[key] = props[key];
            initialState[key] = props[key];
          }
          if (initialQueryValue !== undefined) {
            const value = options[key].fromQueryString(initialQueryValue, props);
            initialState[key] = value;
            serialized[QueryContainer.formatNamespace(namespace, key)] = initialQueryValue;
            return { ...initial, [key]: value };
          }
          return initial;
        }, props);
        this.components[namespace] = {
          options, props, optionsSelector, blankState, state: initialState, serialized
        };
        if (!this.namespaceGc[namespace]) {
          this.namespaceGc[namespace] = 1;
        }

        this.props.history.replace({
          ...this.props.history.location,
          state: { ...this.props.history.location.state, __componentState: this.currentComponentState() }
        });

        this.updateState(namespace, serialized);

        return { state, serialized };
      },
        /* will replace the blank state with the current state */
      persistCurrentState: (namespace?: string = DEFAULT_NAMESPACE): boolean => {
        if (!this.components[namespace]) {
          return false;
        }
        this.components[namespace].blankState = this.components[namespace].state;
        return true;
      },
        /* generates the query string for the given namespace(s) */
      createQueryString: (...namespaces: Array<string>) => {
        return createQueryString(this.state.persistedComponents, ...namespaces);
      },
      unregister: (namespace?:string = DEFAULT_NAMESPACE) => {
        this.namespaceGc[namespace] -= 1;
        if (this.namespaceGc[namespace] === 0) {
          if (this.components[namespace] !== undefined) {
            this.components[namespace].optionsSelector.clearCache();
            delete this.components[namespace];
          }
          delete this.namespaceGc[namespace];
        }
        const { [namespace]: value, ...rest } = this.state.persistedComponents;
        this.setState({ persistedComponents: rest });
      },
      isTransitioning: () => this.isTransitioning
    };
  }

  updateState(ns: string, serialized: Object) {
    const persistedComponents = this.state.persistedComponents;
    this.setState({ persistedComponents: { ...persistedComponents, [ns]: serialized } });
  }

  componentWillUnmount() {
    if (this.listener) {
      this.listener();
    }
    this.components = {};
    this.isTransitioning = false;
  }

  render() {
    const { children } = this.props;
    const { persistedComponents } = this.state;
    return (
      <QueryManagerContext.Provider value={{ queryManager: this.queryManager, queries: persistedComponents }}>
        {children}
      </QueryManagerContext.Provider>
    );
  }
}
