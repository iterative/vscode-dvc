import React from 'react'
import { SectionCollapsed } from 'dvc/src/setup/webview/contract'
import { showExperiments, showScmPanel } from './messages'
import { NoData } from './NoData'
import { NeedsGitCommit } from './NeedsGitCommit'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { IconButton } from '../../shared/components/button/IconButton'
import { Beaker } from '../../shared/components/icons'
import { Button } from '../../shared/components/button/Button'

type ExperimentsProps = {
  isDvcSetup: boolean
  hasData: boolean | undefined
  setSectionCollapsed: (sectionCollapsed: SectionCollapsed) => void
  needsGitCommit: boolean
}

export const Experiments: React.FC<ExperimentsProps> = ({
  isDvcSetup,
  hasData,
  setSectionCollapsed,
  needsGitCommit
}) => {
  if (!isDvcSetup) {
    return (
      <EmptyState isFullScreen={false}>
        <h1>DVC is not setup</h1>
        <p>DVC needs to be setup before you can access experiments.</p>
        <Button
          onClick={() =>
            setSectionCollapsed({
              dvc: false,
              experiments: true,
              studio: true
            })
          }
          text="Setup DVC"
        />
      </EmptyState>
    )
  }

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
