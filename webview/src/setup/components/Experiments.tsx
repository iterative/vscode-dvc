import React from 'react'
import { useDispatch } from 'react-redux'
import { showExperiments, showScmPanel } from './messages'
import { NoData } from './NoData'
import { NeedsGitCommit } from './NeedsGitCommit'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { IconButton } from '../../shared/components/button/IconButton'
import { Beaker } from '../../shared/components/icons'
import { Button } from '../../shared/components/button/Button'
import { updateSectionCollapsed } from '../state/setupDataSlice'

type ExperimentsProps = {
  isDvcSetup: boolean
  hasData: boolean | undefined
  needsGitCommit: boolean
}

export const Experiments: React.FC<ExperimentsProps> = ({
  isDvcSetup,
  hasData,
  needsGitCommit
}) => {
  const dispatch = useDispatch()

  if (!isDvcSetup) {
    return (
      <EmptyState isFullScreen={false}>
        <h1>DVC is not setup</h1>
        <p>DVC needs to be setup before you can access experiments.</p>
        <Button
          onClick={() =>
            dispatch(
              updateSectionCollapsed({
                dvc: false,
                experiments: true,
                studio: true
              })
            )
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
