import { render } from '@testing-library/react'
import { Editor } from 'src/Editor'

// TODO create mock folder, and move all mocks there
jest.mock('use-resize-observer', () =>
  jest.fn().mockReturnValue({ ref: null, width: 100, height: 100 })
)

describe('Editor component', () => {
  it('should be rendered', () => {
    expect(render(<Editor />)).toMatchSnapshot()
  })
})
