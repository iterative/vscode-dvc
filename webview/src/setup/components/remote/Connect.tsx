import React from 'react'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'

export const Connect: React.FC = () => (
  <EmptyState isFullScreen={false}>
    <h1>Connect to Remote Storage</h1>
    <p>
      DVC remotes provide access to external storage locations to track and
      share your data and ML models. Usually, those will be shared between
      devices or team members who are working on a project. For example, you can
      download data artifacts created by colleagues without spending time and
      resources to regenerate them locally.
    </p>
    <p>
      See{' '}
      <a href="https://dvc.org/doc/user-guide/data-management/remote-storage">
        dvc.org
      </a>{' '}
      for details on how to connect to a remote
    </p>
  </EmptyState>
)
