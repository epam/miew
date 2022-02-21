import styled from '@emotion/styled'
import hexToRgba from 'hex-to-rgba'
import { StatusPanel } from './StatusPanel'

export const ControlPanel = () => {
  const Panel = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: absolute;
    top: 0;
    width: 100%;
    background-color: ${({ theme }) =>
      hexToRgba(theme.miew.palette.primary.dark, 0.75)};
    z-index: 10;
    height: 40px;
  `
  const SubPanel = styled.div`
    display: flex;
  `

  return (
    <Panel>
      <SubPanel />
      <StatusPanel />
      <SubPanel />
    </Panel>
  )
}
