import React from 'react'
import styles from './styles.module.scss'
import { DragDropItem, DragDropItemProps } from './DragDropItem'

interface DragDropItemWithTargetProps extends DragDropItemProps {
  dropTarget: JSX.Element | null
  isAfter?: boolean
}

export const DragDropItemWithTarget: React.FC<DragDropItemWithTargetProps> = ({
  dropTarget,
  isAfter,
  ...props
}) => {
  const { shouldShowOnDrag, draggable } = props

  const itemWithTag = (
    <DragDropItem key={draggable.key} {...props} isDiv={shouldShowOnDrag} />
  )
  const block = isAfter ? [itemWithTag, dropTarget] : [dropTarget, itemWithTag]

  return shouldShowOnDrag ? (
    <draggable.type className={styles.newBlockWhenShowingOnDrag}>
      {block}
    </draggable.type>
  ) : (
    block
  )
}
