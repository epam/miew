import { useEffect } from 'react'
import { useAppDispatch, useAppSelector, RootState } from 'state'
import { INIT, INIT_FAIL } from 'state/common'
import Button from '@mui/material/Button'
import styled from '@emotion/styled'

export const App = () => {
  const StyledBtn = styled(Button)(({ theme }) => {
    return {
      border: `1px solid ${theme.customTheme?.palette?.accent?.main}`,
      margin: '10px'
    }
  })

  const StyledDiv = styled.div(({ theme }) => ({
    color: `${theme.customTheme?.palette?.primary?.dark}`,
    fontSize: '14px'
  }))

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
    <StyledDiv>
      <p>HELLO, I am Miew!</p>
      {error && <p>Failed to initialize App, Error: {error}</p>}
      {!isInitialized && !error && <p>App is not initialized</p>}
      {isInitialized && <p>App is initialized, data recieved: {data}</p>}
      <StyledBtn onClick={() => dispatch(INIT())}>Re-initialize app</StyledBtn>
      <StyledBtn onClick={() => dispatch(INIT_FAIL('ERROR'))}>
        Simulate error
      </StyledBtn>
    </StyledDiv>
  )
}
