import useResizeObserver from 'use-resize-observer'
import clsx from 'clsx'
import classes from './Miew.module.scss'

const MEDIA_SIZES = {
  smallWidth: 800,
  smallHeight: 400
}

type Props = {
  text: string
}

function Miew({ text }: Props) {
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
      <p>HELLO, I am Miew!</p>
      <p>{text}</p>
      <p>
        Width: {width} Height: {height}
      </p>
    </div>
  )
}

export { Miew }
