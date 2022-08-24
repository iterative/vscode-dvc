import cx from 'classnames'
import React from 'react'
import { Icon } from '../../../shared/components/Icon'
import { GraphLine } from '../../../shared/components/icons'
import styles from '../styles.module.scss'

interface RowDropTargetProps {
  colSpan: number
}

export const RowDropTarget: React.FC<RowDropTargetProps> = ({ colSpan }) => {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className={cx(styles.dropTarget, styles.rowDropTarget)}>
          <Icon
            icon={GraphLine}
            className={styles.dropIcon}
            width={50}
            height={50}
          />
        </div>
      </td>
    </tr>
  )
}
