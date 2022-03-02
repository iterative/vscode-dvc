import React, { useState, useEffect } from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { HoverMenu } from '../hoverMenu/HoverMenu'
import { Icon, IconValues } from '../icon/Icon'

export interface IconMenuItemProps {
  icon: IconValues
  onClick?: () => void
  onClickNode?: React.ReactNode
  tooltip: string
}

export interface IconMenuItemAllProps extends IconMenuItemProps {
  canShowOnClickNode?: boolean
  index: number
  onMouseOver: (id: string) => void
  last?: boolean
}

export const IconMenuItem: React.FC<IconMenuItemAllProps> = ({
  icon,
  index,
  onClick,
  onClickNode,
  tooltip,
  onMouseOver,
  canShowOnClickNode,
  last
}) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [showOnClickNode, setShowOnClickNode] = useState(false)

  useEffect(() => {
    if (!canShowOnClickNode && showOnClickNode) {
      setShowOnClickNode(false)
    }
  }, [canShowOnClickNode, showOnClickNode])

  const onClickItem = () => {
    onClick?.()
    onClickNode && canShowOnClickNode && setShowOnClickNode(true)
  }
  const onClickElseWhere = () => {
    setShowTooltip(false)
    onClickNode && setShowOnClickNode(false)
  }
  const onMouseEnter = () => {
    setShowTooltip(true)
    onMouseOver(tooltip)
  }
  const onMouseLeave = () => {
    setShowTooltip(false)
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) =>
    e.key === 'Enter' && onClickItem()

  const classes = cx(styles.item, { [styles.last]: last })

  return (
    <li>
      <div
        className={classes}
        role="button"
        tabIndex={index}
        onClick={onClickItem}
        onBlur={onClickElseWhere}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onKeyDown={onKeyDown}
        data-testid="icon-menu-item"
      >
        <Icon
          icon={icon}
          className={styles.icon}
          data-testid="icon-menu-item-icon"
          width={15}
        />
        <div className={styles.hoverMenu}>
          <HoverMenu show={showTooltip && !showOnClickNode}>
            {tooltip}
          </HoverMenu>
          {onClickNode && (
            <HoverMenu
              show={showOnClickNode}
              hideWithDelay={canShowOnClickNode}
            >
              {onClickNode}
            </HoverMenu>
          )}
        </div>
      </div>
    </li>
  )
}
