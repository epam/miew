// TODO: fix typings & use absolute path for imports
/*eslint-disable */
// @ts-nocheck
import MenuIcon from '../../../assets/icons/files/menu.svg'
import ChevronRightIcon from '../../../assets/icons/files/chevron-right.svg'
import PictureIcon from '../../../assets/icons/files/picture.svg'
import DropIcon from '../../../assets/icons/files/drop.svg'
import { useTheme } from '@emotion/react'
/* eslint-enable */

const iconMap = {
  'chevron-right': ChevronRightIcon,
  drop: DropIcon,
  menu: MenuIcon,
  picture: PictureIcon
}

type IconNameType = keyof typeof iconMap

type IconPropsType = {
  name: string
  className?: string
}

const Icon = ({ name, className }: IconPropsType) => {
  const theme = useTheme()
  const Component = iconMap[name]

  if (!Component) {
    return null
  }

  const fallbackColor = theme.miew.palette.primary.main

  return (
    <Component
      className={className}
      stroke={fallbackColor}
      fill={fallbackColor}
      role="img"
      style={{ width: '100%', height: '100%' }}
    />
  )
}

export { Icon }
export type { IconNameType }
