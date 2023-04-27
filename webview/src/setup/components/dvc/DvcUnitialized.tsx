import React, { PropsWithChildren } from 'react'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'

export const DvcUninitialized: React.FC<
  PropsWithChildren<{
    initializeDvc: () => void
  }>
> = ({ initializeDvc, children }) => (
  <EmptyState isFullScreen={false}>
    <h1>DVC is not initialized</h1>
    {children}
    <p>
      The current workspace does not contain a DVC project. You can initialize a
      project which will enable features powered by DVC. To learn more about how
      to use DVC please read <a href="https://dvc.org/doc">our docs</a>.
    </p>
    <Button onClick={initializeDvc} text="Initialize Project"></Button>
  </EmptyState>
)
