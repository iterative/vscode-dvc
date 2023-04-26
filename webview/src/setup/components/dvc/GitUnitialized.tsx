import React, { PropsWithChildren } from 'react'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'

interface GitUninitializedProps {
  canGitInitialize: boolean | undefined
  initializeGit: () => void
}

export const GitUninitialized: React.FC<
  PropsWithChildren<GitUninitializedProps>
> = ({ canGitInitialize, initializeGit, children }) => {
  const conditionalContent = canGitInitialize ? (
    <Button onClick={initializeGit} text="Initialize Git" />
  ) : (
    <>
      <p>
        The extension is unable to initialize a Git repository in this
        workspace.
      </p>
      <p>
        Please open a different folder which contains no Git repositories or a
        single existing Git repository at the root.
      </p>
    </>
  )

  return (
    <EmptyState isFullScreen={false}>
      <h1>DVC is not initialized</h1>
      {children}
      <p>A Git repository is a prerequisite of project initialization.</p>
      {conditionalContent}
    </EmptyState>
  )
}
