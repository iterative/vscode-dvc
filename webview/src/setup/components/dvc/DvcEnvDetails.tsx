import React from 'react'
import { useSelector } from 'react-redux'
import { DvcCliDetails } from 'dvc/src/setup/webview/contract'
import {
  LATEST_TESTED_CLI_VERSION,
  MIN_CLI_VERSION
} from 'dvc/src/cli/dvc/contract'
import { DetailsTable } from '../shared/DetailsTable'
import {
  DetailsTableRow,
  DetailsTableRowActions
} from '../shared/DetailsTableRow'
import { setupWorkspace, updatePythonEnvironment } from '../../util/messages'
import { SetupState } from '../../store'

export const DvcEnvDetails: React.FC<DvcCliDetails> = ({
  command,
  version
}) => {
  const isPythonExtensionUsed = useSelector(
    (state: SetupState) => state.dvc.isPythonExtensionUsed
  )
  const commandRowActions: DetailsTableRowActions = [
    { onClick: setupWorkspace, text: 'Locate DVC' }
  ]

  if (isPythonExtensionUsed) {
    commandRowActions.push({
      onClick: updatePythonEnvironment,
      text: 'Set Env'
    })
  }

  return (
    <DetailsTable testId="dvc-env-details">
      {version && (
        <DetailsTableRow
          title="Command"
          text={command || 'Not found'}
          actions={commandRowActions}
        />
      )}
      <DetailsTableRow
        title="Version"
        text={`${
          version || 'Not found'
        } (required ${MIN_CLI_VERSION} and above, tested with ${LATEST_TESTED_CLI_VERSION})`}
      />
    </DetailsTable>
  )
}
