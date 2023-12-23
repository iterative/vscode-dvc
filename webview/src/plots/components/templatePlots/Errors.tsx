import React from 'react'
import styles from './styles.module.scss'
import { PlotsState } from '../../store'
import { Error } from '../../../shared/components/icons'

export const Errors: React.FC<{ errors: PlotsState['template']['errors'] }> = ({
  errors
}) => {
  const revErrors = Object.entries(errors)
  if (revErrors.length === 0) {
    return
  }

  return (
    <div className={styles.errors}>
      <h3 className={styles.errorsTitle}>
        <Error className={styles.errorsIcon} width="16" height="16" />
        Errors
      </h3>
      <table>
        <tbody>
          {revErrors.map(([path, msgsByRev]) => (
            <>
              <tr>
                <th colSpan={2} className={styles.errorsPlot}>
                  {path}
                </th>
              </tr>
              {Object.entries(msgsByRev).map(([rev, msgs], ind) => (
                <tr key={ind}>
                  <td className={styles.errorsRev}>{rev}</td>
                  <td className={styles.errorsMsgs}>{msgs.join('\n')}</td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
