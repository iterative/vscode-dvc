import React, { useState } from 'react'
import { IconMenuItem, IconMenuItemProps } from './IconMenuItem'
import styles from './styles.module.scss'

export enum IconMenuDirection {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}
interface IconMenuProps {
  items: IconMenuItemProps[]
  direction?: IconMenuDirection
}

export const IconMenu: React.FC<IconMenuProps> = ({
  items,
  direction = IconMenuDirection.RIGHT
}) => {
  const [hoverKey, setHoverKey] = useState('')

  return (
    <ul className={styles.menu} role="menu">
      {items.map((item, i) => (
        <IconMenuItem
          key={item.tooltip}
          {...item}
          canShowOnClickNode={item.tooltip === hoverKey}
          onMouseOver={setHoverKey}
          last={i >= items.length - 2 && direction === IconMenuDirection.RIGHT}
          index={i}
        />
      ))}
    </ul>
  )
}
