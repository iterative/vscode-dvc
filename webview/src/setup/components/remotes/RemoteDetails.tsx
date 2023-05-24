import React from 'react'
import { RemoteList } from 'dvc/src/setup/webview/contract'
import { MultiProjectRemotes } from './MultiProjectRemotes'
import { ProjectRemotes } from './ProjectRemotes'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'
import { addRemote, modifyRemote, removeRemote } from '../messages'

export const RemoteDetails: React.FC<{
  remoteList: NonNullable<RemoteList>
}> = ({ remoteList }) => {
  const remoteValues = Object.values(remoteList)
  return (
    <EmptyState isFullScreen={false}>
      <h1>Remote Storage Connected</h1>
      {remoteValues.length > 1 ? (
        <MultiProjectRemotes remoteList={remoteList} />
      ) : (
        <ProjectRemotes
          remotes={remoteValues[0] as { [alias: string]: string }}
        />
      )}
      <Button text="Modify" onClick={modifyRemote} />
      <Button
        appearance="secondary"
        isNested={true}
        onClick={addRemote}
        text="Add"
      />
      <Button
        appearance="secondary"
        isNested={true}
        onClick={removeRemote}
        text="Remove"
      />
    </EmptyState>
  )
}
