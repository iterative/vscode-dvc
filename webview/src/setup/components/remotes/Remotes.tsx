import React from 'react'
import { RemoteList } from 'dvc/src/setup/webview/contract'
import { Connect } from './Connect'
import { DvcUninitialized } from './DvcUninitialized'
import { RemoteDetails } from './RemoteDetails'
import { StorageSlider } from './StorageSlider'
import { CliIncompatible } from '../shared/CliIncompatible'

export const Remotes: React.FC<{
  cliCompatible: boolean
  remoteList: RemoteList
}> = ({ cliCompatible, remoteList }) => {
  if (!cliCompatible) {
    return (
      <CliIncompatible>
        <p>Locate DVC to connect to a remote</p>
        <StorageSlider />
      </CliIncompatible>
    )
  }

  if (!remoteList) {
    return <DvcUninitialized />
  }

  if (Object.values(remoteList).some(Boolean)) {
    return <RemoteDetails remoteList={remoteList} />
  }

  return <Connect />
}
