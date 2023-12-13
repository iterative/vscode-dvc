import React from 'react'
import { useSelector } from 'react-redux'
import { DEFAULT_STUDIO_URL } from 'dvc/src/setup/webview/contract'
import { Connect } from './Connect'
import { Settings } from './Settings'
import { SetupState } from '../../store'
import { CliIncompatible } from '../shared/CliIncompatible'
import { DetailsTable } from '../shared/DetailsTable'
import { DetailsTableRow } from '../shared/DetailsTableRow'
import { removeStudioUrl, saveStudioUrl } from '../../util/messages'

export const Studio: React.FC<{
  cliCompatible: boolean
  setShareLiveToStudio: (shareLiveToStudio: boolean) => void
}> = ({ cliCompatible, setShareLiveToStudio }) => {
  const { isStudioConnected, selfHostedStudioUrl } = useSelector(
    (state: SetupState) => state.studio
  )

  if (!cliCompatible) {
    return (
      <CliIncompatible>
        <p>
          Locate DVC to connect to <a href={DEFAULT_STUDIO_URL}>Studio</a>
        </p>
      </CliIncompatible>
    )
  }

  const children = (
    <DetailsTable testId="studio-url-details">
      <DetailsTableRow
        title="Self-Hosted Url"
        text={selfHostedStudioUrl || 'Not found'}
        actions={
          selfHostedStudioUrl
            ? [
                {
                  onClick: saveStudioUrl,
                  text: 'Update'
                },
                {
                  onClick: removeStudioUrl,
                  text: 'Remove'
                }
              ]
            : [{ onClick: saveStudioUrl, text: 'Add Url' }]
        }
      />
    </DetailsTable>
  )

  return isStudioConnected ? (
    <Settings setShareLiveToStudio={setShareLiveToStudio}>{children}</Settings>
  ) : (
    <Connect>{children}</Connect>
  )
}
