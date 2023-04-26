import React from 'react'
import { SectionCollapsed } from 'dvc/src/setup/webview/contract'
import { Connect } from './Connect'
import { Settings } from './Settings'
import { CliIncompatible } from './CliIncompatible'

export const Studio: React.FC<{
  isStudioConnected: boolean
  shareLiveToStudio: boolean
  cliCompatible: boolean
  setSectionCollapsed: (sectionCollapsed: SectionCollapsed) => void
  setShareLiveToStudio: (shareLiveToStudio: boolean) => void
}> = ({
  cliCompatible,
  isStudioConnected,
  shareLiveToStudio,
  setSectionCollapsed,
  setShareLiveToStudio
}) => {
  if (!cliCompatible) {
    return <CliIncompatible setSectionCollapsed={setSectionCollapsed} />
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
