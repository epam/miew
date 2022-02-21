import styled from '@emotion/styled'
import { ControlButton } from './ControlButton'
import { StatusPanel } from './StatusPanel'
import { rgba } from 'emotion-rgba'

const buttonsMap = {
  menu: {
    icon: 'menu',
    tip: 'Open menu'
  },
  terminal: {
    icon: 'chevron-right',
    tip: 'Terminal'
  },
  mode: {
    icon: 'picture',
    tip: 'Display mode'
  },
  color: {
    icon: 'drop',
    tip: 'Display color'
  }
}

const defaultMainButtons = ['menu', 'terminal']
const defaultQuickButtons = ['mode', 'color']

const mapToButtons = (buttons: string[]) => {
  return buttons.map((btn, index) => (
    <ControlButton
      buttonIcon={buttonsMap[btn].icon}
      tip={buttonsMap[btn].tip}
      key={index}
    />
  ))
}

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
      <SubPanel> {mapToButtons(defaultMainButtons)} </SubPanel>
      <StatusPanel />
      <SubPanel> {mapToButtons(defaultQuickButtons)} </SubPanel>
    </Panel>
  )
}
