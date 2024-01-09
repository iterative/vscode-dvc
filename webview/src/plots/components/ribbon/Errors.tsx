import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styles from './styles.module.scss'
import { PlotsState } from '../../store'
import { Error } from '../../../shared/components/icons'
import { setShowErrorsModal } from '../webviewSlice'

export const Errors: React.FC = () => {
  const dispatch = useDispatch()
  const [errorsTotal, setErrorsTotal] = useState(0)
  const errors = useSelector((state: PlotsState) => state.webview.plotErrors)

  useEffect(() => {
    let total = 0
    for (const { revs } of errors) {
      total += revs.length
    }
    setErrorsTotal(total)
  }, [errors])

  if (errors.length === 0) {
    return
  }

  return (
    <li className={styles.errors}>
      <button
        className={styles.errorsButton}
        onClick={() => dispatch(setShowErrorsModal(true))}
      >
        <Error className={styles.errorsIcon} width="16" height="16" />
        {errorsTotal === 1 ? 'Show error' : `Show ${errorsTotal} errors`}
      </button>
    </li>
  )
}
