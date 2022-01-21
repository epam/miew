import { render } from '@testing-library/react'
import 'jest-canvas-mock'
import { Viewer } from './Viewer'

jest.mock('use-resize-observer', () =>
  jest.fn().mockReturnValue({ ref: null, width: 100, height: 100 })
)

jest.mock('miew', () => ({
  Miew: jest.fn(() => ({ init: jest.fn(() => true), run: jest.fn() }))
}))

const customTheme = {
  palette: {
    accent: {
      main: '#f00'
    },
    primary: {
      main: '#e2b6b6',
      light: '#fcf8f8',
      dark: '#8e4343'
    }
  },
  typography: {
    fontSize: 14
  }
}

describe('Viewer component', () => {
  it('should be rendered', () => {
    expect(render(<Viewer />)).toMatchSnapshot()
  })
  it('should apply custom theme when theme prop is provided', () => {
    expect(render(<Viewer theme={customTheme} />)).toMatchSnapshot()
  })
})
