import React, { MouseEventHandler } from 'react'

export const CommandLink: React.FC<{
  command: string
  args: Array<unknown>
  onClick: MouseEventHandler
}> = ({ command, args, onClick, children }) => (
  <a
    href={`command:${command}?${encodeURIComponent(JSON.stringify(args))}`}
    onClick={onClick}
  >
    {children}
  </a>
)
