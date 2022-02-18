import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import 'jest-canvas-mock'
import { combineReducers, createStore } from 'redux'
import { Provider } from 'react-redux'
import { Viewer, ViewerMode } from './Viewer'
import { statusReducer } from './state/status/statusSlice'

jest.mock('use-resize-observer', () =>
  jest.fn().mockReturnValue({ ref: null, width: 100, height: 100 })
)

jest.mock('miew', () => ({
  Miew: jest.fn(() => ({
    init: jest.fn(() => true),
    run: jest.fn(),
    addEventListener: jest.fn((e) => e)
  }))
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

const ControlPanelTestId = 'ControlPanel'

const renderComponent = (props = {}) => {
  return render(<Viewer {...props} />, {
    wrapper: ({ children }) => {
      return (
        <Provider
          store={createStore(combineReducers({ status: statusReducer }))}
        >
          {children}
        </Provider>
      )
    }
  })
}

describe('Viewer component', () => {
  it('should apply custom theme when theme prop is provided', () => {
    expect(renderComponent({ theme: customTheme }).container).toMatchSnapshot()
  })
  it('should not contain Control panel, if no mode prop is provided', () => {
    renderComponent()
    expect(screen.queryByTestId(ControlPanelTestId)).not.toBeInTheDocument()
  })
  it('should not contain Control panel, if "minimal" mode prop is provided', () => {
    renderComponent({ mode: ViewerMode.MINIMAL })
    expect(screen.queryByTestId(ControlPanelTestId)).not.toBeInTheDocument()
  })
  it('should contain Control panel, if "default" mode prop is provided', () => {
    renderComponent({ mode: ViewerMode.DEFAULT })
    expect(screen.getByTestId(ControlPanelTestId)).toBeInTheDocument()
  })
  it('should contain Control panel, if "custom" mode prop is provided', () => {
    renderComponent({ mode: ViewerMode.CUSTOM })
    expect(screen.getByTestId(ControlPanelTestId)).toBeInTheDocument()
  })
})
