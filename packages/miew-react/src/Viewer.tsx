import { useLayoutEffect, useRef } from 'react'
import useResizeObserver from 'use-resize-observer'
import { Miew, MiewOptions } from 'miew'
import { Theme } from '@emotion/react'

const MEDIA_SIZES = {
  smallWidth: 800,
  smallHeight: 400
}

type ViewerProps = {
  onInit?: (miew: object) => void
  options?: MiewOptions
}

const Viewer = (props: ViewerProps) => {
  const { onInit, options } = props
  const ref = useRef<HTMLDivElement>(null)
  const { width, height } = useResizeObserver<HTMLDivElement>({ ref })
  const isSizeSmall =
    (height && height <= MEDIA_SIZES.smallHeight) ||
    (width && width <= MEDIA_SIZES.smallWidth)

  const viewerStyle = (theme: Theme) => {
    const palette = theme?.customTheme?.palette
    return {
      backgroundColor: isSizeSmall
        ? palette?.accent?.main
        : palette?.primary?.main,
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

  return <div ref={ref} css={viewerStyle} />
}

export { Viewer }
