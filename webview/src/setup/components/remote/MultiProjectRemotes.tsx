import React from 'react'
import { RemoteList } from 'dvc/src/setup/webview/contract'
import styles from './styles.module.scss'

export const MultiProjectRemotes: React.FC<{
  remoteList: NonNullable<RemoteList>
}> = ({ remoteList }) => (
  <table data-testid="remote-details" className={styles.remoteDetails}>
    <tbody>
      {Object.entries(remoteList).map(([dvcRoot, remotes]) => {
        return remotes ? (
          Object.entries(remotes).map(([alias, remote], i) => (
            <tr key={[alias, remote].join('-')}>
              {i === 0 ? <th className={styles.alias}>{dvcRoot}</th> : <th />}
              <th className={styles.alias}>{alias}</th>
              <th className={styles.remote}>{remote}</th>
            </tr>
          ))
        ) : (
          <tr key={dvcRoot}>
            <th className={styles.alias}>{dvcRoot}</th>
            <th className={styles.empty}>-</th>
            <th className={styles.empty}>-</th>
          </tr>
        )
      })}
    </tbody>
  </table>
)
