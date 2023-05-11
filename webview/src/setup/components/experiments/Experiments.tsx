import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NoData } from './NoData'
import { NeedsGitCommit } from './NeedsGitCommit'
import { showExperiments } from '../messages'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { IconButton } from '../../../shared/components/button/IconButton'
import { Beaker } from '../../../shared/components/icons'
import { Button } from '../../../shared/components/button/Button'
import { updateSectionCollapsed } from '../../state/webviewSlice'
import { SetupState } from '../../store'

type ExperimentsProps = {
  isDvcSetup: boolean
}

export const Experiments: React.FC<ExperimentsProps> = ({ isDvcSetup }) => {
  const dispatch = useDispatch()
  const { needsGitCommit, hasData } = useSelector(
    (state: SetupState) => state.experiments
  )

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
      <IconButton
        appearance="primary"
        icon={Beaker}
        onClick={showExperiments}
        text="Show Experiments"
      />
    </EmptyState>
  )
}
