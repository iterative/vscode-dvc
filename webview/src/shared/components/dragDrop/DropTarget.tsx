import React, { DragEventHandler } from 'react'

interface DropTargetProps {
  children: JSX.Element
  onDragOver: DragEventHandler<HTMLElement>
  onDrop: DragEventHandler<HTMLElement>
  id: string
  className?: string
}

export const DropTarget: React.FC<DropTargetProps> = ({
  children,
  onDragOver,
  onDrop,
  id,
  className
}) => (
  <div
    data-testid="drop-target"
    onDragOver={onDragOver}
    onDrop={onDrop}
    id={`${id}__drop`}
    className={className}
  >
    {children}
  </div>
)
