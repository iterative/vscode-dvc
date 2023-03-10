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
  showScmPanel
} from './messages'
import { NeedsGitCommit } from './NeedsGitCommit'
import { NoData } from './NoData'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'

export type SetupExperimentsProps = {
  canGitInitialize: boolean | undefined
  cliCompatible: boolean | undefined
  hasData: boolean | undefined
  isPythonExtensionInstalled: boolean
  needsGitInitialized: boolean | undefined
  needsGitCommit: boolean
  projectInitialized: boolean
  pythonBinPath: string | undefined
}

export const SetupExperiments: React.FC<SetupExperimentsProps> = ({
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
    return <EmptyState>Loading Project...</EmptyState>
  }

  if (!hasData) {
    return <NoData />
  }

  return <EmptyState>{"You're all setup"}</EmptyState>
}
