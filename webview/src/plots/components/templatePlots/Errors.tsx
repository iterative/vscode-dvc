import React from 'react'
import styles from './styles.module.scss'
import { PlotsState } from '../../store'
import { Error } from '../../../shared/components/icons'

export const Errors: React.FC<{ errors: PlotsState['template']['errors'] }> = ({
  errors
}) => {
  if (errors.length === 0) {
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
          {errors.map(({ path, revs }) => (
            <>
              <tr>
                <th colSpan={2} className={styles.errorsPlot}>
                  {path}
                </th>
              </tr>
              {revs.map(({ rev, msg }) => (
                <tr key={rev}>
                  <td className={styles.errorsRev}>{rev}</td>
                  <td className={styles.errorsMsgs}>{msg}</td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
