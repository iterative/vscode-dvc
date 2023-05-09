import React from 'react'
import { Connect } from './Connect'
import { Settings } from './Settings'
import { CliIncompatible } from './CliIncompatible'

export const Studio: React.FC<{
  isStudioConnected: boolean
  shareLiveToStudio: boolean
  cliCompatible: boolean
  setShareLiveToStudio: (shareLiveToStudio: boolean) => void
}> = ({
  cliCompatible,
  isStudioConnected,
  shareLiveToStudio,
  setShareLiveToStudio
}) => {
  if (!cliCompatible) {
    return <CliIncompatible />
  }

  return isStudioConnected ? (
    <Settings
      shareLiveToStudio={shareLiveToStudio}
      setShareLiveToStudio={setShareLiveToStudio}
    />
  ) : (
    <Connect />
  )
}
