import { render } from '@testing-library/react'
import 'jest-canvas-mock'
import { Viewer } from 'src/Viewer'

// TODO create mock folder, and move all mocks there
jest.mock('use-resize-observer', () =>
  jest.fn().mockReturnValue({ ref: null, width: 100, height: 100 })
)

describe('Miew component', () => {
  it('should be rendered', () => {
    expect(render(<Viewer />)).toMatchSnapshot()
  })
})
