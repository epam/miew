import useResizeObserver from 'use-resize-observer'
import clsx from 'clsx'
import classes from './Miew.module.scss'

const mediaSizes = {
  smallWidth: 800,
  smallHeight: 400
}

function Miew(props) {
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
      <p>HELLO, I am Miew!</p>
      <p>{props.text}</p>
      <p>
        Width: {width} Height: {height}
      </p>
    </div>
  )
}

export { Miew }
