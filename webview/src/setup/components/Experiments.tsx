import React from 'react'
import { showExperiments, showScmPanel } from './messages'
import { NoData } from './NoData'
import { NeedsGitCommit } from './NeedsGitCommit'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { IconButton } from '../../shared/components/button/IconButton'
import { Beaker } from '../../shared/components/icons'

export type ExperimentsProps = {
  hasData: boolean | undefined
  needsGitCommit: boolean
}

export const Experiments: React.FC<ExperimentsProps> = ({
  hasData,
  needsGitCommit
}) => {
  if (needsGitCommit) {
    return <NeedsGitCommit showScmPanel={showScmPanel} />
  }

  if (hasData === undefined) {
    return <EmptyState isFullScreen={false}>Loading Project...</EmptyState>
  }

  if (!hasData) {
    return <NoData />
  }

  return (
    <EmptyState isFullScreen={false}>
      <h1>Setup Complete</h1>
      <IconButton
        appearance="primary"
        icon={Beaker}
        onClick={showExperiments}
        text="Show Experiments"
      />
    </EmptyState>
  )
}
