import React, { MouseEventHandler } from 'react'
import styles from '../styles.module.scss'

type ClickableTooltipContentProps = {
  clickableText: string
  helperText: string
  onClick: MouseEventHandler
}

export const ClickableTooltipContent: React.FC<
  ClickableTooltipContentProps
> = ({ clickableText, helperText, onClick }) => (
  <span>
    {helperText}
    <br />
    <button className={styles.buttonAsLink} onClick={onClick}>
      {clickableText}
    </button>
  </span>
)
