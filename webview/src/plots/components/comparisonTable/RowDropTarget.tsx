import cx from 'classnames'
import React from 'react'
import { useSelector } from 'react-redux'
import { Icon } from '../../../shared/components/Icon'
import { GraphLine } from '../../../shared/components/icons'
import { PlotsState } from '../../store'
import styles from '../styles.module.scss'

interface RowDropTargetProps {
  colSpan: number
}

export const RowDropTarget: React.FC<RowDropTargetProps> = ({ colSpan }) => {
  const rowHeight = useSelector(
    (state: PlotsState) => state.comparison.rowHeight
  )

  return (
    <tr>
      <td colSpan={colSpan}>
        <div
          className={cx(styles.dropTarget, styles.rowDropTarget)}
          style={{ height: rowHeight }}
        >
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
