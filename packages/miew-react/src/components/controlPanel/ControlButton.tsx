import styled from '@emotion/styled'
import { Icon, IconNameType } from 'components/shared/icon/icon'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import { rgba } from 'emotion-rgba'

type buttonProps = {
  buttonIcon: IconNameType
  tip: string
}

export const ControlButton = ({ buttonIcon, tip }: buttonProps) => {
  const Tooltip = styled.div`
    border: 1px solid
      ${({ theme }) => rgba(theme.miew.palette.primary.light, 0.75)};
    background-color: ${({ theme }) =>
      rgba(theme.miew.palette.primary.light, 0.75)};
    border-radius: 3px;
    padding: 3px;
    color: ${({ theme }) => theme.miew.palette.secondary.dark};
    font-size: 12px;
    margin-top: 10px;
  `

  const renderTooltip = () => <Tooltip>{tip}</Tooltip>

  const StyledButton = styled.button`
    color: silver;
    background-color: transparent;
    border: none;
    border-radius: 0;
    width: 40px;
    height: 40px;
    padding: 10px;
  `
  return (
    <OverlayTrigger
      placement="bottom"
      delay={{ show: 250, hide: 400 }}
      overlay={renderTooltip()}
    >
      <StyledButton>
        <Icon name={buttonIcon} />
      </StyledButton>
    </OverlayTrigger>
  )
}
