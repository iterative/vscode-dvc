import React, { PropsWithChildren } from 'react'
import { useSelector } from 'react-redux'
import { GitUninitialized } from './GitUnitialized'
import { DvcUninitialized } from './DvcUnitialized'
import { SetupState } from '../../store'

interface ProjectUninitializedProps {
  initializeDvc: () => void
  initializeGit: () => void
}

export const ProjectUninitialized: React.FC<
  PropsWithChildren<ProjectUninitializedProps>
> = ({ initializeDvc, initializeGit, children }) => {
  const needsGitInitialized = useSelector(
    (state: SetupState) => state.dvc.needsGitInitialized
  )

  if (needsGitInitialized) {
    return (
      <GitUninitialized initializeGit={initializeGit}>
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
