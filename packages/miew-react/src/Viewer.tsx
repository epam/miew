import { useLayoutEffect, useRef } from 'react'
import { Provider } from 'react-redux'
import { Miew, MiewOptions } from 'miew'
import useResizeObserver from 'use-resize-observer'
import { Theme, ThemeProvider } from '@emotion/react'
import { createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { merge } from 'lodash'
import { store } from 'state'
import { defaultTheme, MiewTheme } from './theming'

const MEDIA_SIZES = {
  smallWidth: 800,
  smallHeight: 400
}

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
}

type ViewerProps = {
  onInit?: (miew: Miew) => void
  options?: MiewOptions
  theme?: DeepPartial<MiewTheme>
}

const muiTheme = createTheme()

const Viewer = ({ onInit, options, theme }: ViewerProps) => {
  const viewerTheme = theme ? merge(defaultTheme, theme) : defaultTheme

  const ref = useRef<HTMLDivElement>(null)
  const { width, height } = useResizeObserver<HTMLDivElement>({ ref })

  const isSizeSmall =
    (height && height <= MEDIA_SIZES.smallHeight) ||
    (width && width <= MEDIA_SIZES.smallWidth)

  const viewerStyle = (theme: Theme) => {
    const palette = theme.miew.palette
    return {
      backgroundColor: isSizeSmall ? palette.accent.main : palette.primary.main,
      height: '100%',
      width: '100%',
      '& > .miew-canvas': {
        height: '100%',
        width: '100%'
      }
    }
  }

  useLayoutEffect(() => {
    const miew = new Miew({
      container: ref?.current,
      ...options
    })
    if (miew.init()) miew.run()
    if (typeof onInit === 'function') onInit(miew)
  }, [options, onInit])

  return (
    <Provider store={store}>
      <ThemeProvider theme={merge(muiTheme, { miew: viewerTheme })}>
        <CssBaseline />
        <div ref={ref} css={viewerStyle} />
      </ThemeProvider>
    </Provider>
  )
}

export { Viewer }
