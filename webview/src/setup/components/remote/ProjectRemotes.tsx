import React from 'react'
import styles from './styles.module.scss'

export const ProjectRemotes: React.FC<{
  remotes: { [alias: string]: string }
}> = ({ remotes }) => (
  <table data-testid="remote-details" className={styles.remoteDetails}>
    <tbody>
      {Object.entries(remotes).map(([alias, remote]) => (
        <tr key={[alias, remote].join('-')}>
          <td className={styles.alias}>{alias}</td>
          <td className={styles.remote}>{remote}</td>
        </tr>
      ))}
    </tbody>
  </table>
)
