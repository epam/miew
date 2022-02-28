import { useLayoutEffect, useRef } from 'react'
import { Miew, MiewOptions, MiewEvents } from 'miew'
import useResizeObserver from 'use-resize-observer'
import { css, Theme, ThemeProvider } from '@emotion/react'
import { createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { merge } from 'lodash'
import { defaultTheme, MiewTheme } from './theming'
import { AppDispatch, useAppDispatch } from 'state'
import { ControlPanel } from 'components/controlPanel'
import { UPDATE_STATUS, UPDATE_MOLECULE_INFO } from 'state/info'
import hexToRgba from 'hex-to-rgba'

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

const addStatusListeners = (miew: Miew, dispatch: AppDispatch) => {
  const events = [
    MiewEvents.FETCHING,
    MiewEvents.FETCHING_DONE,
    MiewEvents.LOADING,
    MiewEvents.LOADING_DONE,
    MiewEvents.PARSING,
    MiewEvents.PARSING_DONE,
    MiewEvents.REBUILDING,
    MiewEvents.BUILDING_DONE,
    MiewEvents.EXPORTING,
    MiewEvents.EXPORTING_DONE
  ]
  return events.reduce((acc, event) => {
    const eventCallback = () => dispatch(UPDATE_STATUS(event))
    miew.addEventListener(event, eventCallback)
    return { ...acc, [event]: eventCallback }
  }, {})
}

const addTitleListener = (miew: Miew, dispatch: AppDispatch) => {
  const eventCallback = (event) => dispatch(UPDATE_MOLECULE_INFO(event.data))
  miew.addEventListener(MiewEvents.TITLE_CHANGED, eventCallback)
  return { [MiewEvents.TITLE_CHANGED]: eventCallback }
}

const addListeners = (miew: Miew, dispatch: AppDispatch) => {
  return {
    ...addStatusListeners(miew, dispatch),
    ...addTitleListener(miew, dispatch)
  }
}

const removeListeners = (miew: Miew, listeners: object) => {
  Object.entries(listeners).forEach(([event, callback]) =>
    miew.removeEventListener(event, callback)
  )
}

const getStyle = (isSizeSmall, hasControlPanel) => {
  return (theme: Theme) => {
    const palette = theme.miew.palette
    return css({
      backgroundColor: isSizeSmall ? palette.accent.main : palette.primary.main,
      height: '100%',
      width: '100%',
      position: 'relative',
      '& > .miew-canvas': {
        height: '100%',
        width: '100%'
      },
      '& > .overlay': {
        position: 'absolute',
        top: hasControlPanel ? '47px' : '10px',
        right: '10px',
        borderRadius: '4px',
        color: palette.secondary.light,
        backgroundColor: hexToRgba(palette.primary.dark, 0.75),
        p: {
          margin: '10px',
          textAlign: 'left'
        }
      }
    })
  }
}

const muiTheme = createTheme()

const Viewer = ({
  onInit,
  options,
  theme,
  mode = ViewerMode.MINIMAL
}: ViewerProps) => {
  const dispatch = useAppDispatch()

  const viewerTheme = theme ? merge(defaultTheme, theme) : defaultTheme

  const ref = useRef<HTMLDivElement>(null)
  const { width, height } = useResizeObserver<HTMLDivElement>({ ref })

  const isSizeSmall =
    (height && height <= MEDIA_SIZES.smallHeight) ||
    (width && width <= MEDIA_SIZES.smallWidth)

  const hasControlPanel = mode !== ViewerMode.MINIMAL

  const style = getStyle(isSizeSmall, hasControlPanel)

  useLayoutEffect(() => {
    const miew = new Miew({
      container: ref?.current,
      ...options
    })
    if (miew.init()) miew.run()
    if (typeof onInit === 'function') onInit(miew)

    const callbacks = addListeners(miew, dispatch)
    return () => removeListeners(miew, callbacks)
  }, [options, onInit])

  return (
    <ThemeProvider theme={merge(muiTheme, { miew: viewerTheme })}>
      <CssBaseline />
      {hasControlPanel && <ControlPanel />}
      <div ref={ref} css={style} />
    </ThemeProvider>
  )
}

export { Viewer }
