import React, { ReactElement } from 'react'
import Tooltip from './Tooltip'
import { ErrorTooltipContent } from './ErrorTooltipContent'

export const ErrorTooltip: React.FC<{
  error?: string
  children: ReactElement
}> = ({ children, error }) => (
  <Tooltip
    content={<ErrorTooltipContent error={error} />}
    placement="bottom"
    disabled={!error}
  >
    {children}
  </Tooltip>
)
