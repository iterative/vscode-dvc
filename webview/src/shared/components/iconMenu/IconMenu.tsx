import Tippy, { useSingleton } from '@tippyjs/react'
import React, { useState } from 'react'
import { IconMenuItem, IconMenuItemProps } from './IconMenuItem'
import styles from './styles.module.scss'
import sharedStyles from '../../styles.module.scss'

interface IconMenuProps {
  items: IconMenuItemProps[]
}

export const IconMenu: React.FC<IconMenuProps> = ({ items }) => {
  const [tooltipDisabled, setTooltipDisabled] = useState<boolean>(false)
  const [menuSource, menuTarget] = useSingleton()
  const [tooltipSource, tooltipTarget] = useSingleton({
    disabled: tooltipDisabled
  })

  return (
    <Tippy
      arrow={false}
      singleton={tooltipSource}
      className={sharedStyles.menu}
      animation={false}
      placement="bottom-end"
      disabled={tooltipDisabled}
      popperOptions={{
        modifiers: [
          {
            enabled: false,
            name: 'flip'
          },
          {
            name: 'computeStyles',
            options: {
              adaptive: false
            }
          }
        ]
      }}
    >
      <Tippy
        arrow={false}
        trigger="click"
        interactive
        singleton={menuSource}
        className={sharedStyles.menu}
        animation={false}
        placement="bottom"
        onShow={() => {
          setTooltipDisabled(true)
        }}
        onHide={() => {
          setTooltipDisabled(false)
        }}
      >
        <ul className={styles.menu} role="menu">
          {items.map(item => (
            <IconMenuItem
              {...item}
              key={item.tooltip}
              tooltipTarget={tooltipTarget}
              menuTarget={menuTarget}
            />
          ))}
        </ul>
      </Tippy>
    </Tippy>
  )
}
