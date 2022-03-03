import React from 'react'
import Tippy, { TippyProps } from '@tippyjs/react'
import styles from './styles.module.scss'
import sharedStyles from '../../styles.module.scss'
import { Icon, IconValues } from '../icon/Icon'

export interface IconMenuItemProps {
  icon: IconValues
  onClick?: () => void
  onClickNode?: React.ReactNode
  tooltip: string
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
    <Tippy
      content={tooltip}
      singleton={tooltipTarget}
      className={sharedStyles.menu}
    >
      <button
        aria-label={tooltip}
        className={styles.item}
        onClick={onClick}
        data-testid="icon-menu-item"
      >
        <Icon
          icon={icon}
          className={styles.icon}
          data-testid="icon-menu-item-icon"
          width={15}
        />
      </button>
    </Tippy>
  )
  if (onClickNode) {
    button = (
      <Tippy content={onClickNode} singleton={menuTarget}>
        {button}
      </Tippy>
    )
  }
  return <li>{button}</li>
}
