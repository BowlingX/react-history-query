// @flow

import { useContext } from 'react'
import { QueryManagerContext } from './components/QueryContainer'
import { QueryContext } from './connectQueryToProps'

const useQuery = () => {
  const { queryManager: { persistCurrentState, createQueryString } = { } } = useContext(QueryManagerContext) || {}
  const queries = useContext(QueryContext)

  return {
    queries,
    createQueryString,
    persistCurrentState
  }
}

export default useQuery
