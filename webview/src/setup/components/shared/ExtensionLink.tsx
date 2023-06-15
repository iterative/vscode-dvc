import React, { PropsWithChildren } from 'react'
import type { HTMLAttributes } from 'react'

interface ExtensionLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  extensionId: string
}

export const ExtensionLink: React.FC<PropsWithChildren<ExtensionLinkProps>> = ({
  extensionId,
  children,
  ...props
}) => {
  const idQuery = `"@id:${extensionId}"`
  return (
    <a
      href={`command:workbench.extensions.search?${encodeURIComponent(
        idQuery
      )}`}
      {...props}
    >
      {children}
    </a>
  )
}
