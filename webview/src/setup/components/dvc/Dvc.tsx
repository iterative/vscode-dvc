import React from 'react'
import {
  DvcCliDetails,
  SetupSection,
  SectionCollapsed
} from 'dvc/src/setup/webview/contract'
import { DvcEnvDetails } from './DvcEnvDetails'
import { CliIncompatible } from './CliIncompatible'
import { ProjectUninitialized } from './ProjectUninitialized'
import { CliUnavailable } from './CliUnavailable'
import {
  checkCompatibility,
  initializeDvc,
  initializeGit,
  installDvc,
  setupWorkspace
} from '../messages'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { useIsSectionComplete } from '../../hooks/useIsSectionComplete'

export type DvcProps = {
  canGitInitialize: boolean | undefined
  cliCompatible: boolean | undefined
  dvcCliDetails: DvcCliDetails | undefined
  isPythonExtensionUsed: boolean
  needsGitInitialized: boolean | undefined
  projectInitialized: boolean
  pythonBinPath: string | undefined
  setSectionCollapsed: (sectionCollapsed: SectionCollapsed) => void
  hasReceivedMessageFromVsCode: boolean
}

export const Dvc: React.FC<DvcProps> = ({
  canGitInitialize,
  cliCompatible,
  dvcCliDetails,
  isPythonExtensionUsed,
  needsGitInitialized,
  projectInitialized,
  pythonBinPath,
  hasReceivedMessageFromVsCode,
  setSectionCollapsed
}) => {
  const isSetup = projectInitialized && !!cliCompatible

  const onCompletion = () => {
    setSectionCollapsed({
      [SetupSection.DVC]: true,
      [SetupSection.EXPERIMENTS]: false,
      [SetupSection.STUDIO]: false
    })
  }

  useIsSectionComplete(isSetup, hasReceivedMessageFromVsCode, onCompletion)

  const children = dvcCliDetails && (
    <DvcEnvDetails
      {...dvcCliDetails}
      isPythonExtensionUsed={isPythonExtensionUsed}
    />
  )

  if (cliCompatible === false) {
    return (
      <CliIncompatible checkCompatibility={checkCompatibility}>
        {children}
      </CliIncompatible>
    )
  }

  if (cliCompatible === undefined) {
    return (
      <CliUnavailable
        installDvc={installDvc}
        pythonBinPath={pythonBinPath}
        setupWorkspace={setupWorkspace}
      >
        {children}
      </CliUnavailable>
    )
  }

  if (!projectInitialized) {
    return (
      <ProjectUninitialized
        canGitInitialize={canGitInitialize}
        initializeDvc={initializeDvc}
        initializeGit={initializeGit}
        needsGitInitialized={needsGitInitialized}
      >
        {children}
      </ProjectUninitialized>
    )
  }
  return (
    <EmptyState isFullScreen={false}>
      <h1>Setup Complete</h1>
      {children}
    </EmptyState>
  )
}
