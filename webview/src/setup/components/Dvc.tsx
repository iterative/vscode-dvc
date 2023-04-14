import React from 'react'
import { DvcCliDetails, SectionCollapsed } from 'dvc/src/setup/webview/contract'
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
  showExperiments
} from './messages'

import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Beaker } from '../../shared/components/icons'
import { IconButton } from '../../shared/components/button/IconButton'

export type DvcProps = {
  canGitInitialize: boolean | undefined
  cliCompatible: boolean | undefined
  dvcCliDetails: DvcCliDetails | undefined
  isPythonExtensionInstalled: boolean
  needsGitInitialized: boolean | undefined
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
