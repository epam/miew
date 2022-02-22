import { useAppSelector } from 'state/hooks'
import { RootState } from 'state/store'
import styled from '@emotion/styled'

const statusesMap = {
  fetching: 'Fetching...',
  fetchingDone: 'Fetching is done',
  loading: 'Loading...',
  loadingDone: 'Loading is done',
  parsing: 'Parsing...',
  parsingDone: 'Parsing is done',
  rebuilding: 'Building geometry...',
  buildingDone: 'Building geometry is done'
}

export const StatusPanel = () => {
  const StyledSpan = styled.span`
    color: ${({ theme }) => theme.miew.palette.secondary.light};
  `
  const { status, title } = useAppSelector((state: RootState) => state.status)

  return <StyledSpan>{title || statusesMap[status]}</StyledSpan>
}
