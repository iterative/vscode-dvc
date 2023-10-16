import React, { ReactElement, PropsWithChildren } from 'react'
import Tooltip from '../../shared/components/tooltip/Tooltip'

interface ZoomablePlotWrapperProps {
  title?: string
  id: string
}

export const ZoomablePlotWrapper: React.FC<
  PropsWithChildren<ZoomablePlotWrapperProps>
> = ({ title, id, children }) => {
  const isTitleCut = title?.indexOf('…') === 0

  return isTitleCut ? (
    <Tooltip content={id} placement="top" interactive>
      {children as ReactElement}
    </Tooltip>
  ) : (
    children
  )
}
