import React, { useState } from 'react'
import { useSingleton } from '@tippyjs/react'
import { IconMenuItem, IconMenuItemProps } from './IconMenuItem'
import styles from './styles.module.scss'
import Tooltip from '../tooltip/Tooltip'

interface IconMenuProps {
  items: IconMenuItemProps[]
}

const popperOptions = {
  modifiers: [
    {
      name: 'computeStyles',
      options: {
        adaptive: false
      }
    }
  ]
}

export const IconMenu: React.FC<IconMenuProps> = ({ items }) => {
  const [tooltipDisabled, setTooltipDisabled] = useState<boolean>(false)
  const [menuSource, menuTarget] = useSingleton()
  const [tooltipSource, tooltipTarget] = useSingleton({
    disabled: tooltipDisabled
  })

  const visibleItems = items.filter(({ hidden }) => !hidden)

  return (
    <Tooltip
      singleton={tooltipSource}
      placement="bottom-end"
      popperOptions={popperOptions}
      disabled={tooltipDisabled}
    >
      <Tooltip
        trigger="click"
        interactive
        singleton={menuSource}
        placement="bottom"
        popperOptions={popperOptions}
        onShow={() => {
          setTooltipDisabled(true)
        }}
        onHide={() => {
          setTooltipDisabled(false)
        }}
      >
        {visibleItems.length > 0 ? (
          <ul className={styles.menu} role="menu">
            {visibleItems.map(item => (
              <IconMenuItem
                {...item}
                key={item.tooltip}
                tooltipTarget={tooltipTarget}
                menuTarget={menuTarget}
              />
            ))}
          </ul>
        ) : (
          <></>
        )}
      </Tooltip>
    </Tooltip>
  )
}
