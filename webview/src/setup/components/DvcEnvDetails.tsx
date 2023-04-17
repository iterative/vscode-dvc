import React from 'react'
import { DvcCliDetails, DvcCliIndicator } from 'dvc/src/setup/webview/contract'

const getTextBasedOffType = (
  type: string,
  location: string,
  version: string | undefined
) => {
  if (type === DvcCliIndicator.GLOBAL && version) {
    return `The extension is using a global version of DVC at ${location}.`
  }

  if (type === DvcCliIndicator.GLOBAL && !version) {
    return "The extension can't find DVC."
  }

  return `The extension is using python located at ${location}.`
}

export const DvcEnvDetails: React.FC<DvcCliDetails> = ({
  location,
  version,
  type
}) => {
  return (
    <div>
      <h2>DVC CLI Info</h2>
      <p>{getTextBasedOffType(type, location, version)}</p>
    </div>
  )
}
