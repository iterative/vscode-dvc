import React, { useState, useEffect } from 'react'
import styles from './styles.module.scss'
import { HoverMenu } from '../hoverMenu/HoverMenu'

export interface IconMenuItemProps {
  icon: string
  onClick?: () => void
  onClickNode?: React.ReactNode
  tooltip: string
}

export interface IconMenuItemAllProps extends IconMenuItemProps {
  canShowOnClickNode?: boolean
  index: number
  onMouseOver: (id: string) => void
}

export const IconMenuItem: React.FC<IconMenuItemAllProps> = ({
  icon,
  index,
  onClick,
  onClickNode,
  tooltip,
  onMouseOver,
  canShowOnClickNode
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

  return (
    <li>
      <div
        className={styles.item}
        role="button"
        tabIndex={index}
        onClick={onClickItem}
        onBlur={onClickElseWhere}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onKeyDown={onKeyDown}
        data-testid="icon-menu-item"
      >
        <img
          className={styles.icon}
          src={icon}
          alt={tooltip}
          data-testid="icon-menu-item-icon"
        />
        <div className={styles.hoverMenu}>
          <HoverMenu show={showTooltip && !showOnClickNode}>
            {tooltip}
          </HoverMenu>
          {onClickNode && (
            <HoverMenu show={showOnClickNode} hideWithDelay>
              {onClickNode}
            </HoverMenu>
          )}
        </div>
      </div>
    </li>
  )
}
