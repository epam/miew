import useResizeObserver from 'use-resize-observer'
import clsx from 'clsx'
import { AppContainer } from 'components/App'
import classes from './Miew.module.scss'

const mediaSizes = {
  smallWidth: 800,
  smallHeight: 400
}

const Miew = () => {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>()

  return (
    <div
      className={clsx(classes.miew, {
        [classes.small]:
          (height && height <= mediaSizes.smallHeight) ||
          (width && width <= mediaSizes.smallWidth)
      })}
      ref={ref}
    >
      <AppContainer />
    </div>
  )
}

export { Miew }
