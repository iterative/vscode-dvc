import React from 'react'
import { RemoteList } from 'dvc/src/setup/webview/contract'
import { CliIncompatible } from './CliIncompatible'
import styles from './styles.module.scss'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'

export const Remote: React.FC<{
  cliCompatible: boolean
  remoteList: RemoteList
}> = ({ cliCompatible, remoteList }) => {
  if (!cliCompatible) {
    return <CliIncompatible />
  }

  return remoteList ? (
    <EmptyState isFullScreen={false}>
      <h1>Remote Data Storage Connected</h1>
      <table data-testid="remote-details" className={styles.remoteDetails}>
        <tbody>
          {Object.entries(remoteList).map(([alias, remote]) => (
            <tr key={[alias, remote].join('-')}>
              <td className={styles.remoteKey}>{alias}</td>
              <td className={styles.remoteValue}>{remote}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </EmptyState>
  ) : (
    <EmptyState isFullScreen={false}>
      <h1>Connect to Remote Data Storage</h1>
      <p>
        See{' '}
        <a href="https://dvc.org/doc/user-guide/data-management/remote-storage">
          dvc.org
        </a>{' '}
        for details on how to connect to a remote
      </p>
    </EmptyState>
  )
}
