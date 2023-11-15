import React from 'react'
import { useSelector } from 'react-redux'
import { STUDIO_URL } from 'dvc/src/setup/webview/contract'
import { Connect } from './Connect'
import { Settings } from './Settings'
import { SetupState } from '../../store'
import { CliIncompatible } from '../shared/CliIncompatible'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'

export const Studio: React.FC<{
  cliCompatible: boolean
  setShareLiveToStudio: (shareLiveToStudio: boolean) => void
}> = ({ cliCompatible, setShareLiveToStudio }) => {
  const { isStudioConnected, isStudioConnecting } = useSelector(
    (state: SetupState) => state.studio
  )

  if (isStudioConnecting) {
    return <EmptyState isFullScreen={false}>Connecting to Studio...</EmptyState>
  }

  if (!cliCompatible) {
    return (
      <CliIncompatible>
        <p>
          Locate DVC to connect to <a href={STUDIO_URL}>Studio</a>
        </p>
      </CliIncompatible>
    )
  }

  return isStudioConnected ? (
    <Settings setShareLiveToStudio={setShareLiveToStudio} />
  ) : (
    <Connect />
  )
}
