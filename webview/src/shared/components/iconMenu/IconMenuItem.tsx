import React from 'react'
import cx from 'classnames'
import { TippyProps } from '@tippyjs/react'
import styles from './styles.module.scss'
import { Icon, IconValues } from '../Icon'
import Tooltip from '../tooltip/Tooltip'

export interface IconMenuItemProps {
  icon: IconValues
  onClick?: () => void
  onClickNode?: React.ReactNode
  tooltip: string
  hidden?: boolean
}

export interface IconMenuItemAllProps extends IconMenuItemProps {
  tooltipTarget: TippyProps['singleton']
  menuTarget: TippyProps['singleton']
}

export const IconMenuItem: React.FC<IconMenuItemAllProps> = ({
  icon,
  onClick,
  onClickNode,
  tooltip,
  tooltipTarget,
  menuTarget
}) => {
  let button = (
    <Tooltip content={tooltip} singleton={tooltipTarget}>
      <button
        aria-label={tooltip}
        className={cx(styles.item, { [styles.clickable]: !!onClick })}
        onClick={onClick}
        data-testid="icon-menu-item"
      >
        <Icon icon={icon} data-testid="icon-menu-item-icon" width={15} />
      </button>
    </Tooltip>
  )
  if (onClickNode) {
    button = (
      <Tooltip content={onClickNode} singleton={menuTarget}>
        {button}
      </Tooltip>
    )
  }
  return <li>{button}</li>
}
