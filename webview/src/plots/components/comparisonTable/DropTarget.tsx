import React from 'react'
import { DropTargetIndicator } from './DropTargetIndicator'
import { DragEnterDirection } from '../../../shared/components/dragDrop/util'
import styles from '../styles.module.scss'

export const DropTarget: React.FC<Props> = ({ children, direction }) => (
  <div className={styles.dropTarget} data-testid="comparison-drop-target">
    <DropTargetIndicator direction={direction} />
    {React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.createElement('div', child.props)
      }

      return child
    })}
  </div>
)

interface Props {
  direction: DragEnterDirection
}
