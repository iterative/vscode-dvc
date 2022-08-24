import React, { HTMLAttributes } from 'react'

interface DropTargetProps extends HTMLAttributes<HTMLDivElement> {
  children: JSX.Element
  id: string
  wrapper?: JSX.Element
}

export const DropTarget: React.FC<DropTargetProps> = ({
  children,
  id,
  wrapper,
  ...props
}) => {
  const wrap = wrapper || <div />
  return (
    <wrap.type data-testid="drop-target" id={`${id}__drop`} {...props}>
      {children}
    </wrap.type>
  )
}
