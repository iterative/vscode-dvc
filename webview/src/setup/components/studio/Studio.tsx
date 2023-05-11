import React from 'react'
import { useSelector } from 'react-redux'
import { Connect } from './Connect'
import { Settings } from './Settings'
import { CliIncompatible } from './CliIncompatible'
import { SetupState } from '../../store'

export const Studio: React.FC<{
  cliCompatible: boolean
  setShareLiveToStudio: (shareLiveToStudio: boolean) => void
}> = ({ cliCompatible, setShareLiveToStudio }) => {
  const { isStudioConnected } = useSelector((state: SetupState) => state.studio)

  if (!cliCompatible) {
    return <CliIncompatible />
  }

  return isStudioConnected ? (
    <Settings setShareLiveToStudio={setShareLiveToStudio} />
  ) : (
    <Connect />
  )
}
