import { useEffect } from 'react'
import { useAppDispatch, useAppSelector, RootState } from 'state'
import { INIT, INIT_FAIL } from 'state/common'
import Button from '@mui/material/Button'
import { css } from '@emotion/react'

const btnStyle = (theme) =>
  css({
    border: `1px solid ${theme.customTheme.palette.primary.main}`,
    margin: '10px'
  })

const textStyle = (theme) =>
  css({
    color: theme.customTheme.palette.primary.dark,
    fontSize: '14px'
  })

export const App = () => {
  const isInitialized = useAppSelector(
    (state: RootState) => state.init.isInitialized
  )
  const data = useAppSelector((state: RootState) => state.init.data)
  const error = useAppSelector((state: RootState) => state.init.error)
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(INIT())
  }, [dispatch])

  return (
    <div css={textStyle}>
      <p>HELLO, I am Miew!</p>
      {error && <p>Failed to initialize App, Error: {error}</p>}
      {!isInitialized && !error && <p>App is not initialized</p>}
      {isInitialized && (
        <p css={textStyle}>App is initialized, data recieved: {data}</p>
      )}
      <Button css={btnStyle} onClick={() => dispatch(INIT())}>
        Re-initialize app
      </Button>
      <Button
        css={btnStyle}
        color="secondary"
        onClick={() => dispatch(INIT_FAIL('ERROR'))}
      >
        Simulate error
      </Button>
    </div>
  )
}
