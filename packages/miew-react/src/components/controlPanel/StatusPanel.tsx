import { useAppSelector } from 'state/hooks'
import { RootState } from 'state/store'
import styled from '@emotion/styled'

const statusesMap = {
  fetching: 'Fetching...',
  parsing: 'Parsing...',
  rebuilding: 'Building geometry...',
  buildingDone: 'Building is ready'
}

export const StatusPanel = () => {
  const StyledSpan = styled.span`
    color: ${({ theme }) => theme.miew.palette.secondary.light};
  `
  const { status, title } = useAppSelector((state: RootState) => state.status)

  return <StyledSpan>{title || statusesMap[status]}</StyledSpan>
}
