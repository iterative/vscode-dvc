import React from 'react'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'

const Header: React.FC = () => <h1>DVC is not initialized</h1>

interface GitUninitializedProps {
  canGitInitialize: boolean | undefined
  initializeGit: () => void
}

const GitIsPrerequisite: React.FC = () => (
  <p>A Git repository is a prerequisite of project initialization.</p>
)

const GitUninitialized: React.FC<GitUninitializedProps> = ({
  canGitInitialize,
  initializeGit
}) => {
  if (!canGitInitialize) {
    return (
      <EmptyState isFullScreen={false}>
        <Header />
        <GitIsPrerequisite />
        <p>
          The extension is unable to initialize a Git repository in this
          workspace.
        </p>
        <p>
          Please open a different folder which contains no Git repositories or a
          single existing Git repository at the root.
        </p>
      </EmptyState>
    )
  }

  return (
    <EmptyState isFullScreen={false}>
      <Header />
      <GitIsPrerequisite />
      <Button onClick={initializeGit} text="Initialize Git" />
    </EmptyState>
  )
}

const DvcUninitialized: React.FC<{ initializeDvc: () => void }> = ({
  initializeDvc
}) => (
  <EmptyState isFullScreen={false}>
    <Header />
    <p>
      The current workspace does not contain a DVC project. You can initialize a
      project which will enable features powered by DVC. To learn more about how
      to use DVC please read <a href="https://dvc.org/doc">our docs</a>.
    </p>
    <Button onClick={initializeDvc} text="Initialize Project"></Button>
  </EmptyState>
)

export interface ProjectUninitializedProps {
  canGitInitialize: boolean | undefined
  initializeDvc: () => void
  initializeGit: () => void
  needsGitInitialized: boolean | undefined
}

export const ProjectUninitialized: React.FC<ProjectUninitializedProps> = ({
  initializeDvc,
  needsGitInitialized,
  canGitInitialize,
  initializeGit
}) => {
  if (needsGitInitialized) {
    return (
      <GitUninitialized
        initializeGit={initializeGit}
        canGitInitialize={canGitInitialize}
      />
    )
  }

  return <DvcUninitialized initializeDvc={initializeDvc} />
}
