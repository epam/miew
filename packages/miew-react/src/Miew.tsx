import useResizeObserver from 'use-resize-observer'
import clsx from 'clsx'
import { AppContainer } from 'components/App'
import classes from './Miew.module.scss'
import { forwardRef } from 'react'

const MEDIA_SIZES = {
  smallWidth: 800,
  smallHeight: 400
}

const Miew = forwardRef<HTMLDivElement, {}>((props: object, myRef) => {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>()

  return (
    <div
      className={clsx(classes.miew, {
        [classes.small]:
          (height && height <= MEDIA_SIZES.smallHeight) ||
          (width && width <= MEDIA_SIZES.smallWidth)
      })}
      ref={ref}
    >
      <AppContainer {...props} ref={myRef} />
    </div>
  )
})

export { Miew }
