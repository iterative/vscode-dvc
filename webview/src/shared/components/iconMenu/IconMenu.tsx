import React, { useState } from 'react'
import { useSingleton } from '@tippyjs/react'
import { IconMenuItem, IconMenuItemProps } from './IconMenuItem'
import styles from './styles.module.scss'
import Tooltip from '../tooltip/Tooltip'
import tooltipStyles from '../tooltip/styles.module.scss'

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

  return (
    <Tooltip
      className={tooltipStyles.padded}
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
      </Tooltip>
    </Tooltip>
  )
}
