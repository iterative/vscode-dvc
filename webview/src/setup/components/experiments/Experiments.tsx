import React from 'react'
import { useSelector } from 'react-redux'
import { NoData } from './NoData'
import { NeedsGitCommit } from './NeedsGitCommit'
import { DvcLiveExamples } from './DvcLiveExamples'
import { showExperiments } from '../messages'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { IconButton } from '../../../shared/components/button/IconButton'
import { Beaker } from '../../../shared/components/icons'
import { SetupState } from '../../store'
import { FocusDvcSection } from '../shared/FocusDvcSection'

type ExperimentsProps = {
  isDvcSetup: boolean
}

export const Experiments: React.FC<ExperimentsProps> = ({ isDvcSetup }) => {
  const { needsGitCommit, hasData } = useSelector(
    (state: SetupState) => state.experiments
  )

  if (!isDvcSetup) {
    return (
      <EmptyState isFullScreen={false}>
        <h1>DVC is not setup</h1>
        <p>DVC needs to be setup before you can access experiments.</p>
        <FocusDvcSection />
      </EmptyState>
    )
  }

  if (needsGitCommit) {
    return <NeedsGitCommit />
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
      <p>
        Learn more about <a href="https://dvc.org/doc/dvclive">DVCLive</a> by
        reading its documention.
      </p>
      <IconButton
        appearance="primary"
        icon={Beaker}
        onClick={showExperiments}
        text="Show Experiments"
      />
      <DvcLiveExamples />
    </EmptyState>
  )
}
