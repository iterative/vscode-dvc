import React from 'react'
import { SectionCollapsed } from 'dvc/src/setup/webview/contract'
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
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Beaker } from '../../shared/components/icons'
import { IconButton } from '../../shared/components/button/IconButton'

export type DvcProps = {
  canGitInitialize: boolean | undefined
  cliCompatible: boolean | undefined
  isPythonExtensionInstalled: boolean
  needsGitInitialized: boolean | undefined
  needsGitCommit: boolean
  projectInitialized: boolean
  pythonBinPath: string | undefined
  isExperimentsAvailable: boolean | undefined
  setSectionCollapsed: (sectionCollapsed: SectionCollapsed) => void
}

export const Dvc: React.FC<DvcProps> = ({
  canGitInitialize,
  cliCompatible,
  isPythonExtensionInstalled,
  needsGitInitialized,
  needsGitCommit,
  projectInitialized,
  pythonBinPath,
  setSectionCollapsed,
  isExperimentsAvailable
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

  return (
    <EmptyState isFullScreen={false}>
      <h1>Setup Complete</h1>
      <IconButton
        appearance="primary"
        icon={Beaker}
        onClick={
          isExperimentsAvailable
            ? showExperiments
            : () =>
                setSectionCollapsed({
                  dvc: true,
                  experiments: false,
                  studio: true
                })
        }
        text="Show Experiments"
      />
    </EmptyState>
  )
}
