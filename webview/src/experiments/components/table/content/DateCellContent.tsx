import React from 'react'
import styles from '../styles.module.scss'

interface DateCellContentProps {
  children: string
}

const timeFormatter = new Intl.DateTimeFormat([], {
  hour: '2-digit',
  minute: '2-digit'
})
const dateFormatter = new Intl.DateTimeFormat([], {
  dateStyle: 'medium'
})

export const DateCellContents: React.FC<DateCellContentProps> = ({
  children
}) => {
  const date = new Date(children)
  return (
    <span className={styles.cellContents}>
      <div className={styles.timestampTime}>{timeFormatter.format(date)}</div>
      <div className={styles.timestampDate}>{dateFormatter.format(date)}</div>
    </span>
  )
}
