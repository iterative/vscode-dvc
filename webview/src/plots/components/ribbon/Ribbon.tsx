import cx from 'classnames'
import React, { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useInView } from 'react-intersection-observer'
import styles from './styles.module.scss'
import { RibbonBlock } from './RibbonBlock'
import { update } from './ribbonSlice'
import { Errors } from './Errors'
import { IconButton } from '../../../shared/components/button/IconButton'
import { PlotsState } from '../../store'
import { Add, ListFilter, Refresh } from '../../../shared/components/icons'
import {
  addPlot,
  refreshRevisions,
  removeRevision,
  selectRevisions
} from '../../util/messages'

const MAX_NB_EXP = 7

export const Ribbon: React.FC = () => {
  const [ref, needsShadow] = useInView({
    root: document.querySelector('#webview-wrapper'),
    rootMargin: '-5px',
    threshold: 0.95
  })
  const measurementsRef = useRef<HTMLDivElement>()
  const dispatch = useDispatch()

  const revisions = useSelector(
    (state: PlotsState) => state.webview.selectedRevisions
  )

  const changeRibbonHeight = useCallback(
    () =>
      measurementsRef.current &&
      dispatch(update(measurementsRef.current.getBoundingClientRect().height)),
    [dispatch]
  )

  const setInitialRibbonHeight = useCallback(
    () => dispatch(update(0)),
    [dispatch]
  )

  useEffect(() => {
    changeRibbonHeight()

    return () => {
      setInitialRibbonHeight()
    }
  }, [revisions, changeRibbonHeight, setInitialRibbonHeight])

  useEffect(() => {
    window.addEventListener('resize', changeRibbonHeight)

    return () => {
      window.removeEventListener('resize', changeRibbonHeight)
    }
  }, [changeRibbonHeight])

  return (
    <div
      ref={node => {
        if (node) {
          measurementsRef.current = node
        }
        ref(node)
      }}
      data-testid="ribbon"
      className={cx(styles.ribbon, needsShadow && styles.withShadow)}
    >
      <ul className={styles.list}>
        <li className={styles.buttonWrapper}>
          <IconButton onClick={addPlot} icon={Add} text="Add Plot" />
        </li>
        <li className={styles.buttonWrapper}>
          <IconButton
            onClick={selectRevisions}
            icon={ListFilter}
            text={`${revisions.length} of ${MAX_NB_EXP}`}
            appearance="secondary"
          />
        </li>
        <li className={styles.buttonWrapper}>
          <IconButton
            onClick={refreshRevisions}
            icon={Refresh}
            text="Refresh All"
            appearance="secondary"
          />
        </li>
        {revisions.map(revision => (
          <RibbonBlock
            revision={revision}
            key={revision.id}
            onClear={() => removeRevision(revision.id)}
          />
        ))}
      </ul>
      <Errors />
    </div>
  )
}
