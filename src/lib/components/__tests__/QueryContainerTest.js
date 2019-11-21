/**
 * @flow
 */

import * as React from 'react'
import { createBrowserHistory } from 'history'
import Enzyme, { mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import QueryContainer from '../QueryContainer'

Enzyme.configure({ adapter: new Adapter() })

const history = createBrowserHistory()

describe('<QueryContainer/>', () => {
  it('should render a connected component', () => {
    const app = (
      <QueryContainer history={history}>
        <div>App</div>
      </QueryContainer>
    )
    const result = mount(app)
    expect(result.text()).toEqual('App')
  })
})
