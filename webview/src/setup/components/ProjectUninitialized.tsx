import React from 'react'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Button } from '../../shared/components/button/Button'

interface GitUninitializedProps {
  canGitInitialize: boolean | undefined
  initializeGit: () => void
}

const GitUninitialized: React.FC<GitUninitializedProps> = ({
  canGitInitialize,
  initializeGit
}) => {
  if (!canGitInitialize) {
    return (
      <EmptyState>
        <div>
          <h1>DVC is not initialized</h1>
          <p>A Git repository is a prerequisite for project setup</p>
          <p>
            The extension is unable to initialize a new Git repository in this
            workspace
          </p>
          <p>
            Please open a different folder which contains a single existing Git
            repository or none at all
          </p>
        </div>
      </EmptyState>
    )
  }

  return (
    <EmptyState>
      <div>
        <h1>DVC is not initialized</h1>
        <p>The current workspace does not contain a Git repository</p>
        <p>This is a prerequisite for project initialization</p>
        <Button onClick={initializeGit} text="Initialize Git" />
      </div>
    </EmptyState>
  )
}

interface ProjectUninitializedProps {
  initializeDvc: () => void
  needsGitInitialized: boolean | undefined
  canGitInitialize: boolean | undefined
  initializeGit: () => void
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

  return (
    <EmptyState>
      <div>
        <h1>DVC is not initialized</h1>
        <p>
          The current workspace does not contain a DVC project. You can
          initialize a project which will enable features powered by DVC. To
          learn more about how to use DVC please read{' '}
          <a href="https://dvc.org/doc">our docs</a>
        </p>
        <Button onClick={initializeDvc} text="Initialize Project"></Button>
      </div>
    </EmptyState>
  )
}
