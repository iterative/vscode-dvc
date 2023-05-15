import React from 'react'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'
import { showScmPanel } from '../messages'

export const NeedsGitCommit: React.FC = () => (
  <EmptyState isFullScreen={false}>
    <div>
      <h1>No Git commits detected</h1>
      <p>
        At least one commit is required to enable DVC&apos;s experiments and
        plots functionality.
      </p>
      <Button text="Create a Commit" onClick={showScmPanel} />
    </div>
  </EmptyState>
)
