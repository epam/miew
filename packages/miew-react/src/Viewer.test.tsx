import { Viewer, ViewerMode } from './Viewer'
import { render } from '@testing-library/react'
import 'jest-canvas-mock'

jest.mock('use-resize-observer', () =>
  jest.fn().mockReturnValue({ ref: null, width: 100, height: 100 })
)

jest.mock('components/controlPanel', () => ({
  ControlPanel: jest.fn(() => <div>Control Panel</div>)
}))

jest.mock('state', () => ({
  useAppDispatch: jest.fn((arg) => arg)
}))

jest.mock('miew', () => ({
  Miew: jest.fn(() => ({
    init: jest.fn(() => true),
    run: jest.fn(),
    addEventListener: jest.fn((e) => e),
    removeEventListener: jest.fn((e) => e)
  })),
  MiewEvents: jest.requireActual('miew').MiewEvents
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

const { MINIMAL, CUSTOM, DEFAULT } = ViewerMode

describe('Viewer component', () => {
  it('should apply custom theme when theme prop is provided', () => {
    expect(render(<Viewer theme={customTheme} />).container).toMatchSnapshot()
  })
  it('should not contain Control panel, if no mode prop is provided', () => {
    expect(render(<Viewer />).container).toMatchSnapshot()
  })
  it('should not contain Control panel, if "minimal" mode prop is provided', () => {
    expect(render(<Viewer mode={MINIMAL} />).container).toMatchSnapshot()
  })
  it('should contain Control panel, if "default" mode prop is provided', () => {
    expect(render(<Viewer mode={DEFAULT} />).container).toMatchSnapshot()
  })
  it('should contain Control panel, if "custom" mode prop is provided', () => {
    expect(render(<Viewer mode={CUSTOM} />).container).toMatchSnapshot()
  })
})
