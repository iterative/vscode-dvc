import { AnyAction } from '@reduxjs/toolkit'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React, { useRef } from 'react'
import { useDispatch } from 'react-redux'
import { VisualizationSpec } from 'react-vega'
import { ExtendedVegaLite } from './vegaLite/ExtendedVegaLite'
import { setZoomedInPlot } from './webviewSlice'
import styles from './styles.module.scss'
import { ZoomablePlotWrapper } from './ZoomablePlotWrapper'
import { zoomPlot } from '../util/messages'
import { useGetPlot } from '../hooks/useGetPlot'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'
import { Ellipsis } from '../../shared/components/icons'

interface ZoomablePlotProps {
  id: string
  onViewReady?: () => void
  changeDisabledDragIds: (ids: string[]) => AnyAction
  currentSnapPoint: number
  section: PlotsSection
  shouldNotResize?: boolean
}

export const ZoomablePlot: React.FC<ZoomablePlotProps> = ({
  id,
  onViewReady,
  section
}) => {
  const [spec, titles] = useGetPlot(section, id)
  const dispatch = useDispatch()
  const currentPlotProps = useRef<VisualizationSpec>()

  currentPlotProps.current = spec

  const handleOnClick = (openActionsMenu?: boolean) => {
    zoomPlot()

    return dispatch(setZoomedInPlot({ id, openActionsMenu, section }))
  }

  if (!spec) {
    return null
  }

  const onNewView = () => {
    if (onViewReady) {
      onViewReady()
    }
  }

  return (
    <ZoomablePlotWrapper titles={titles}>
      <button
        className={styles.zoomablePlot}
        onClick={() => handleOnClick()}
        aria-label="Open Plot in Popup"
      >
        <GripIcon className={styles.plotGripIcon} />
        <span
          className={styles.plotActions}
          onClick={event => {
            event.stopPropagation()
            handleOnClick(true)
          }}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              handleOnClick(true)
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="See Plot Export Options"
        >
          <Ellipsis />
        </span>
        {currentPlotProps.current && (
          <ExtendedVegaLite
            id={id}
            onNewView={onNewView}
            spec={spec}
            actions={false}
          />
        )}
      </button>
    </ZoomablePlotWrapper>
  )
}
