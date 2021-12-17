import { render } from '@testing-library/react'
import { Miew } from 'src/Miew'

jest.mock('use-resize-observer', () => jest.fn().mockReturnValue({ ref: null, width: 100, height: 100 }))

describe('Miew component', () => {
  it('should be rendered', () => {
    expect(render(<Miew text="test" />)).toMatchSnapshot()
  })
})
