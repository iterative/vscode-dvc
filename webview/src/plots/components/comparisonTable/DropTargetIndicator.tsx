import React from 'react'
import { DragEnterDirection } from '../../../shared/components/dragDrop/util'
import styles from '../styles.module.scss'

export const DropTargetIndicator: React.FC<Props> = ({ direction }) => (
  <span
    className={styles.dropTargetIndicator}
    data-testid="comparison-drop-target-indicator"
    style={{
      [direction.toLowerCase()]: -4
    }}
  />
)

interface Props {
  direction: DragEnterDirection
}
