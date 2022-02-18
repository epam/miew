import { useAppSelector } from 'state/hooks'
import { RootState } from 'state/store'
import styled from '@emotion/styled'

export const StatusPanel = () => {
  const StyledSpan = styled.span`
    color: ${({ theme }) => theme.miew.palette.secondary.light};
  `

  const status = useAppSelector(
    (state: RootState) => state.status.currentStatus
  )
  return <StyledSpan>{status}</StyledSpan>
}
