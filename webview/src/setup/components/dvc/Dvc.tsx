import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SetupSection } from 'dvc/src/setup/webview/contract'
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
import { usePrevious } from '../../hooks/usePrevious'
import { updateSectionCollapsed } from '../../state/webviewSlice'
import { SetupState } from '../../store'

export const Dvc: React.FC = () => {
  const dispatch = useDispatch()
  const hasWebviewData = useSelector(
    (state: SetupState) => state.webview.hasData
  )
  const {
    canGitInitialize,
    cliCompatible,
    dvcCliDetails,
    isPythonExtensionUsed,
    needsGitInitialized,
    projectInitialized,
    pythonBinPath
  } = useSelector((state: SetupState) => state.dvc)
  const [isComplete, setIsComplete] = useState<boolean | null>(null)
  const previousIsComplete = usePrevious(isComplete)

  useEffect(() => {
    const isSetup = projectInitialized && !!cliCompatible

    if (hasWebviewData) {
      setIsComplete(isSetup)
    }

    if (previousIsComplete === false && isComplete) {
      dispatch(
        updateSectionCollapsed({
          [SetupSection.DVC]: true,
          [SetupSection.EXPERIMENTS]: false,
          [SetupSection.STUDIO]: false
        })
      )
    }
  }, [
    dispatch,
    projectInitialized,
    cliCompatible,
    isComplete,
    previousIsComplete,
    hasWebviewData
  ])

  const children = dvcCliDetails && (
    <DvcEnvDetails
      {...dvcCliDetails}
      isPythonExtensionUsed={isPythonExtensionUsed}
    />
  )

  if (!hasWebviewData) {
    return <EmptyState isFullScreen={false}>Loading...</EmptyState>
  }

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
