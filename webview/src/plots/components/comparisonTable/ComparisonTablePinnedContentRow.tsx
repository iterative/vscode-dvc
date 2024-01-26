import React, { PropsWithChildren } from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'

export const ComparisonTablePinnedContentRow: React.FC<
  PropsWithChildren<{ pinnedColumn: string; nbColumns: number }>
> = ({ children, pinnedColumn, nbColumns }) => (
  <tr>
    <td
      className={cx(styles.pinnedColumnContent, {
        [styles.pinnedColumnCell]: pinnedColumn
      })}
      colSpan={1}
    >
      {children}
    </td>
    {nbColumns > 1 && <td colSpan={nbColumns - 1}></td>}
  </tr>
)
