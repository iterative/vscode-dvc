import React, { HTMLAttributes } from 'react'

interface DropTargetProps extends HTMLAttributes<HTMLDivElement> {
  children: JSX.Element
  id: string
}

export const DropTarget: React.FC<DropTargetProps> = ({
  children,
  id,
  ...props
}) => (
  <div data-testid="drop-target" id={`${id}__drop`} {...props}>
    {children}
  </div>
)
