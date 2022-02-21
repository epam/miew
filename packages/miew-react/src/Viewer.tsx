import { useLayoutEffect, useRef } from 'react'
import { Miew, MiewOptions, MiewEvents } from 'miew'
import useResizeObserver from 'use-resize-observer'
import { Theme, ThemeProvider } from '@emotion/react'
import { createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { merge } from 'lodash'
import { defaultTheme, MiewTheme } from './theming'
import { useAppDispatch } from 'state'
import { ControlPanel } from 'components/controlPanel'
import { UPDATE_STATUS, UPDATE_TITLE } from 'state/status'

const MEDIA_SIZES = {
  smallWidth: 800,
  smallHeight: 400
}

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
}

/* eslint-disable no-unused-vars */
// will be used later
export enum ViewerMode {
  MINIMAL = 'minimal',
  DEFAULT = 'default',
  CUSTOM = 'custom'
}

type ViewerProps = {
  onInit?: (miew: Miew) => void
  options?: MiewOptions
  theme?: DeepPartial<MiewTheme>
  mode?: ViewerMode
}

const muiTheme = createTheme()

const Viewer = ({ onInit, options, theme, mode }: ViewerProps) => {
  const dispatch = useAppDispatch()

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
      },
      '& > .atom-info': {
        color: palette.primary.light
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
    miew.addEventListener(MiewEvents.FETCHING, () => {
      dispatch(UPDATE_STATUS(MiewEvents.FETCHING))
    })
    miew.addEventListener(MiewEvents.PARSING, () => {
      dispatch(UPDATE_STATUS(MiewEvents.PARSING))
    })
    miew.addEventListener(MiewEvents.REBUILDING, () => {
      dispatch(UPDATE_STATUS(MiewEvents.REBUILDING))
    })
    miew.addEventListener(MiewEvents.BUILDING_DONE, () => {
      dispatch(UPDATE_STATUS(MiewEvents.BUILDING_DON))
    })
    miew.addEventListener(MiewEvents.TITLE_CHANGED, (e) => {
      dispatch(UPDATE_TITLE(e.data))
    })
  }, [options, onInit])

  return (
    <ThemeProvider theme={merge(muiTheme, { miew: viewerTheme })}>
      <CssBaseline />
      {!mode || mode === ViewerMode.MINIMAL || <ControlPanel />}
      <div ref={ref} css={viewerStyle} />
    </ThemeProvider>
  )
}

export { Viewer }
