import React, { useState } from 'react'
import { IconMenuItem, IconMenuItemProps } from './IconMenuItem'
import styles from './styles.module.scss'

interface IconMenuProps {
  items: IconMenuItemProps[]
}

export const IconMenu: React.FC<IconMenuProps> = ({ items }) => {
  const [hoverKey, setHoverKey] = useState('')

  return (
    <ul className={styles.menu} role="menu">
      {items.map((item, i) => (
        <IconMenuItem
          key={item.tooltip}
          {...item}
          canShowOnClickNode={item.tooltip === hoverKey}
          onMouseOver={setHoverKey}
          index={i}
        />
      ))}
    </ul>
  )
}
