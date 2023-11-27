import React, { PropsWithChildren } from 'react'
import { DragDropItemWithTarget } from '../../shared/components/dragDrop/DragDropItemWithTarget'

type DragAndDropPlotWrapperProps = {
  target: JSX.Element | null
  isAfter?: boolean
}

export const DragAndDropPlotWrapper: React.FC<
  PropsWithChildren<DragAndDropPlotWrapperProps>
> = ({ children, target, isAfter }) => {
  if (!target) {
    return <>{children}</>
  }

  return (
    <DragDropItemWithTarget
      draggable={<div />}
      isAfter={isAfter}
      dropTarget={target}
    >
      {children}
    </DragDropItemWithTarget>
  )
}
