import React from 'react'
import { CliIncompatible } from './CliIncompatible'
import { CliUnavailable } from './CliUnavailable'
import { ProjectUninitialized } from './ProjectUninitialized'
import {
  checkCompatibility,
  initializeDvc,
  initializeGit,
  installDvc,
  selectPythonInterpreter,
  setupWorkspace,
  showExperiments,
  showScmPanel
} from './messages'
import { NeedsGitCommit } from './NeedsGitCommit'
import { NoData } from './NoData'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { IconButton } from '../../shared/components/button/IconButton'
import { Beaker } from '../../shared/components/icons'

export type ExperimentsProps = {
  canGitInitialize: boolean | undefined
  cliCompatible: boolean | undefined
  hasData: boolean | undefined
  isPythonExtensionInstalled: boolean
  needsGitInitialized: boolean | undefined
  needsGitCommit: boolean
  projectInitialized: boolean
  pythonBinPath: string | undefined
}

export const Experiments: React.FC<ExperimentsProps> = ({
  canGitInitialize,
  cliCompatible,
  hasData,
  isPythonExtensionInstalled,
  needsGitInitialized,
  needsGitCommit,
  projectInitialized,
  pythonBinPath
  // eslint-disable-next-line sonarjs/cognitive-complexity
}) => {
  if (cliCompatible === false) {
    return <CliIncompatible checkCompatibility={checkCompatibility} />
  }

  if (cliCompatible === undefined) {
    return (
      <CliUnavailable
        installDvc={installDvc}
        isPythonExtensionInstalled={isPythonExtensionInstalled}
        pythonBinPath={pythonBinPath}
        selectPythonInterpreter={selectPythonInterpreter}
        setupWorkspace={setupWorkspace}
      />
    )
  }

  if (!projectInitialized) {
    return (
      <ProjectUninitialized
        canGitInitialize={canGitInitialize}
        initializeDvc={initializeDvc}
        initializeGit={initializeGit}
        needsGitInitialized={needsGitInitialized}
      />
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
      <h1>{"You're all setup"}</h1>
      <IconButton
        appearance="primary"
        icon={Beaker}
        onClick={showExperiments}
        text="Show Experiments"
      />
    </EmptyState>
  )
}
