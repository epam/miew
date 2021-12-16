// eslint-disable-next-line no-unused-vars
import React from 'react'
import { render } from '@testing-library/react'
import { Miew } from './Miew'

window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
}

describe('Miew component', () => {
  it('should be rendered', () => {
    expect(render(<Miew text="test" />)).toMatchSnapshot()
  })
})
