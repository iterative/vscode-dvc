import React from 'react'
import { SectionCollapsed } from 'dvc/src/setup/webview/contract'
import { showExperiments } from './messages'
import { NoData } from './NoData'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { IconButton } from '../../shared/components/button/IconButton'
import { Beaker } from '../../shared/components/icons'
import { Button } from '../../shared/components/button/Button'

export type ExperimentsProps = {
  isDvcSetup: boolean
  hasData: boolean | undefined
  setSectionCollapsed: (sectionCollapsed: SectionCollapsed) => void
}

export const Experiments: React.FC<ExperimentsProps> = ({
  isDvcSetup,
  hasData,
  setSectionCollapsed
}) => {
  if (!isDvcSetup) {
    return (
      <EmptyState isFullScreen={false}>
        <h1>DVC is not setup</h1>
        {/* TBD review text */}
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
