import React, { PropsWithChildren } from 'react'
import styles from './styles.module.scss'

interface DragDropItemWithTargetProps {
  dropTarget: JSX.Element | null
  draggable: JSX.Element
  isAfter?: boolean
  shouldShowOnDrag?: boolean
}

export const DragDropItemWithTarget: React.FC<
  PropsWithChildren<DragDropItemWithTargetProps>
> = ({ dropTarget, isAfter, shouldShowOnDrag, draggable, children }) => {
  const block = isAfter ? [children, dropTarget] : [dropTarget, children]

  return shouldShowOnDrag ? (
    <draggable.type className={styles.newBlockWhenShowingOnDrag}>
      {block}
    </draggable.type>
  ) : (
    block
  )
}
