import React, { PropsWithChildren } from 'react'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'
import { initializeDvc } from '../messages'

export const DvcUninitialized: React.FC<PropsWithChildren> = ({ children }) => (
  <EmptyState isFullScreen={false}>
    <h1>DVC is not initialized</h1>
    {children}
    <p>
      The current workspace does not contain a DVC project, which is needed to
      enable DVC-powered features. Interested in trying a demo project? Check
      out our{' '}
      <a href="https://github.com/iterative/vscode-dvc-demo">extension demo</a>.
    </p>
    <Button onClick={initializeDvc} text="Initialize Project"></Button>
  </EmptyState>
)
