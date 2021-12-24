import useResizeObserver from 'use-resize-observer'
import { AppContainer } from './components/App'

const MEDIA_SIZES = {
  smallWidth: 800,
  smallHeight: 400
}

const Editor = () => {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>()

  const isSizeSmall =
    (height && height <= MEDIA_SIZES.smallHeight) ||
    (width && width <= MEDIA_SIZES.smallWidth)

  const containerStyle = {
    height: '100%',
    width: '100%',
    backgroundColor: isSizeSmall ? '#eee' : '#fff'
  }

  return (
    <div css={containerStyle} ref={ref}>
      <AppContainer />
    </div>
  )
}

export { Editor }
