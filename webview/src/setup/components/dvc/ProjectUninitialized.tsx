import React, { PropsWithChildren } from 'react'
import { GitUninitialized } from './GitUnitialized'
import { DvcUninitialized } from './DvcUnitialized'

interface ProjectUninitializedProps {
  canGitInitialize: boolean | undefined
  initializeDvc: () => void
  initializeGit: () => void
  needsGitInitialized: boolean | undefined
}

export const ProjectUninitialized: React.FC<
  PropsWithChildren<ProjectUninitializedProps>
> = ({
  initializeDvc,
  needsGitInitialized,
  canGitInitialize,
  initializeGit,
  children
}) => {
  if (needsGitInitialized) {
    return (
      <GitUninitialized
        initializeGit={initializeGit}
        canGitInitialize={canGitInitialize}
      >
        {children}
      </GitUninitialized>
    )
  }

  return (
    <DvcUninitialized initializeDvc={initializeDvc}>
      {children}
    </DvcUninitialized>
  )
}
