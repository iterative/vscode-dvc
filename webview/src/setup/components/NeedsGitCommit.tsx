import React from 'react'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Button } from '../../shared/components/button/Button'

type NeedsGitCommitProps = { showScmPanel: () => void }

export const NeedsGitCommit: React.FC<NeedsGitCommitProps> = ({
  showScmPanel
}) => (
  <EmptyState>
    <div>
      <h1>Your project has no commits in Git</h1>
      <p>
        DVC requires your project to have atleast one commit to run experiments
        correctly.{' '}
      </p>
      <Button text="Create a Commit" onClick={showScmPanel} />
    </div>
  </EmptyState>
)
