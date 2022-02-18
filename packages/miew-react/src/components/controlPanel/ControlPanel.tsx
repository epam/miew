import styled from '@emotion/styled'
import { ControlButton } from './ControlButton'
import { StatusPanel } from './StatusPanel'
import { rgba } from 'emotion-rgba'

export const ControlPanel = () => {
  const Panel = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: absolute;
    top: 0;
    width: 100%;
    background-color: ${({ theme }) =>
      rgba(theme.miew.palette.primary.dark, 0.75)};
    z-index: 10;
  `

  const SubPanel = styled.div`
    display: flex;
  `

  return (
    <Panel data-testid="ControlPanel">
      <SubPanel>
        <ControlButton buttonIcon="menu" tip="Open menu" />
        <ControlButton buttonIcon="chevron-right" tip="Terminal" />
      </SubPanel>
      <StatusPanel />
      <SubPanel>
        <ControlButton buttonIcon="picture" tip="Display mode" />
        <ControlButton buttonIcon="drop" tip="Display color" />
      </SubPanel>
    </Panel>
  )
}
