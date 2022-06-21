import React from 'react'
import { DragEnterDirection } from '../../../shared/components/dragDrop/util'
import styles from '../styles.module.scss'
import { DropTargetIndicator } from './DropTargetIndicator'

export const DropTarget: React.FC<Props> = ({ children, direction }) => (
  <div className={styles.dropTarget} data-testid="comparison-drop-target">
    <DropTargetIndicator direction={direction} />
    {children}
  </div>
)

interface Props {
  direction: DragEnterDirection
}
