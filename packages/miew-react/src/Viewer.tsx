import { useLayoutEffect, useRef } from 'react'
import useResizeObserver from 'use-resize-observer'
import clsx from 'clsx'
import Miew from 'miew'
import classes from './Viewer.module.scss'

const MEDIA_SIZES = {
  smallWidth: 800,
  smallHeight: 400
}

type ViewerProps = {
  onInit?: (miew: object) => void
  options?: object
}

const Viewer = (props: ViewerProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const { width, height } = useResizeObserver<HTMLDivElement>({ ref })
  const { onInit, options } = props

  useLayoutEffect(() => {
    const miew = new Miew({
      container: ref?.current,
      ...options
    })
    if (miew.init()) miew.run()
    if (typeof onInit === 'function') onInit(miew)
  }, [onInit, options])

  // TODO: switch to styled when emotion set-up is merged
  return (
    <div
      className={clsx(classes.viewer, {
        [classes.small]:
          (height && height <= MEDIA_SIZES.smallHeight) ||
          (width && width <= MEDIA_SIZES.smallWidth)
      })}
      ref={ref}
    ></div>
  )
}

export { Viewer }
