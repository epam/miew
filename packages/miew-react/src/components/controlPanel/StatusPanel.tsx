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
  buildingDone: 'Building geometry is done',
  exporting: 'Exporting...',
  exportingDone: 'Exporting is done'
}

const StyledSpan = styled.span`
  color: ${({ theme }) => theme.miew.palette.secondary.light};
`
export const StatusPanel = () => {
  const { status, moleculeInfo } = useAppSelector(
    (state: RootState) => state.info
  )
  return <StyledSpan>{moleculeInfo || statusesMap[status]}</StyledSpan>
}
