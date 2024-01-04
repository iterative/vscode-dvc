import React from 'react'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { Error } from '../../shared/components/icons'
import { PlotsState } from '../store'
import { useModalOpenClass } from '../hooks/useModalOpenClass'

export const ErrorsModal: React.FC = () => {
  const errors = useSelector((state: PlotsState) => state.webview.plotErrors)
  useModalOpenClass()

  return (
    <div className={styles.errorsModal} data-testid="errors-modal">
      <h3 className={styles.errorsModalTitle}>
        <Error className={styles.errorsModalIcon} width="20" height="20" />
        Errors
      </h3>
      <table>
        <tbody>
          {errors.map(({ path, revs }) => (
            <>
              <tr>
                <th colSpan={2} className={styles.errorsModalPlot}>
                  {path}
                </th>
              </tr>
              {revs.map(({ rev, msg }, index) => (
                <tr key={index}>
                  <td className={styles.errorsModalRev}>{rev}</td>
                  <td className={styles.errorsModalMsgs}>{msg}</td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
