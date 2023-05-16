import React from 'react'
import { RemoteList } from 'dvc/src/setup/webview/contract'
import { CliIncompatible } from './CliIncompatible'
import { DvcUninitialized } from './DvcUninitialized'
import styles from './styles.module.scss'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'

export const Remote: React.FC<{
  cliCompatible: boolean
  remoteList: RemoteList
}> = ({ cliCompatible, remoteList }) => {
  if (!cliCompatible) {
    return <CliIncompatible />
  }

  if (!remoteList) {
    return <DvcUninitialized />
  }

  const remoteValues = Object.values(remoteList)

  if (remoteValues.some(Boolean)) {
    return (
      <EmptyState isFullScreen={false}>
        <h1>Storage Connected</h1>
        <table data-testid="remote-details" className={styles.remoteDetails}>
          <tbody>
            {remoteValues.length > 1
              ? // eslint-disable-next-line sonarjs/cognitive-complexity
                Object.entries(remoteList).map(([dvcRoot, remotes]) => {
                  return remotes ? (
                    Object.entries(remotes).map(([alias, remote], i) => (
                      <tr key={[alias, remote].join('-')}>
                        {i === 0 ? (
                          <td className={styles.alias}>{dvcRoot}</td>
                        ) : (
                          <td />
                        )}
                        <td className={styles.alias}>{alias}</td>
                        <td className={styles.remote}>{remote}</td>
                      </tr>
                    ))
                  ) : (
                    <tr key={dvcRoot}>
                      <td className={styles.alias}>{dvcRoot}</td>
                      <td className={styles.empty}>-</td>
                      <td className={styles.empty}>-</td>
                    </tr>
                  )
                })
              : Object.entries(remoteValues[0] || {}).map(([alias, remote]) => (
                  <tr key={[alias, remote].join('-')}>
                    <td className={styles.alias}>{alias}</td>
                    <td className={styles.remote}>{remote}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </EmptyState>
    )
  }

  return (
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
