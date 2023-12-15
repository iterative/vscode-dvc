import React, { PropsWithChildren } from 'react'

import styles from './styles.module.scss'

export const DetailsTable: React.FC<PropsWithChildren<{ testId?: string }>> = ({
  children,
  testId
}) => {
  return (
    <table data-testid={testId} className={styles.detailsTable}>
      <tbody>{children}</tbody>
    </table>
  )
}
