import React, { ReactElement } from 'react'
import styles from './styles.module.scss'

export const DvcEnvInfoRow: React.FC<{
  title: string
  text: string | ReactElement
}> = ({ title, text }) => (
  <tr>
    <td className={styles.envDetailsKey}>{title}</td>
    <td className={styles.envDetailsValue}>{text}</td>
  </tr>
)
