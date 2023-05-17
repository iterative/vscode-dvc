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
              {i === 0 ? <td className={styles.alias}>{dvcRoot}</td> : <td />}
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
      })}
    </tbody>
  </table>
)
