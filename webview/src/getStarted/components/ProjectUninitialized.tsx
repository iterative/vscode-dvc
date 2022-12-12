import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import React from 'react'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'

interface ProjectUninitializedProps {
  initializeProject: () => void
}

export const ProjectUninitialized: React.FC<ProjectUninitializedProps> = ({
  initializeProject
}) => {
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
        <VSCodeButton onClick={initializeProject}>
          Initialize Project
        </VSCodeButton>
      </div>
    </EmptyState>
  )
}
