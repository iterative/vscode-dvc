import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SetupSection } from 'dvc/src/setup/webview/contract'
import { DvcEnvDetails } from './DvcEnvDetails'
import { CliIncompatible } from './CliIncompatible'
import { ProjectUninitialized } from './ProjectUninitialized'
import { CliUnavailable } from './CliUnavailable'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { usePrevious } from '../../hooks/usePrevious'
import { SetupState } from '../../store'
import { closeSection } from '../shared/util'
import { showWalkthrough } from '../../util/messages'
import { Button } from '../../../shared/components/button/Button'

export const Dvc: React.FC = () => {
  const dispatch = useDispatch()
  const hasWebviewData = useSelector(
    (state: SetupState) => state.webview.hasData
  )
  const { cliCompatible, dvcCliDetails, projectInitialized } = useSelector(
    (state: SetupState) => state.dvc
  )
  const [isComplete, setIsComplete] = useState<boolean | null>(null)
  const previousIsComplete = usePrevious(isComplete)

  useEffect(() => {
    const isSetup = projectInitialized && !!cliCompatible

    if (hasWebviewData) {
      setIsComplete(isSetup)
    }

    if (previousIsComplete === false && isComplete) {
      dispatch(closeSection(SetupSection.DVC))
    }
  }, [
    dispatch,
    projectInitialized,
    cliCompatible,
    isComplete,
    previousIsComplete,
    hasWebviewData
  ])

  const children = dvcCliDetails && <DvcEnvDetails {...dvcCliDetails} />

  if (!hasWebviewData) {
    return <EmptyState isFullScreen={false}>Loading...</EmptyState>
  }

  if (cliCompatible === false) {
    return <CliIncompatible>{children}</CliIncompatible>
  }

  if (cliCompatible === undefined) {
    return <CliUnavailable>{children}</CliUnavailable>
  }

  if (!projectInitialized) {
    return <ProjectUninitialized>{children}</ProjectUninitialized>
  }

  return (
    <EmptyState isFullScreen={false}>
      <h1>Setup Complete</h1>
      {children}
      <p>
        New to the extension? Go through the walkthrough to familiarize yourself
        with the different features.
      </p>
      <Button onClick={showWalkthrough} text="Show Walkthrough" />
    </EmptyState>
  )
}
