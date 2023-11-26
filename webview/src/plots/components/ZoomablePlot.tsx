import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React, { useRef } from 'react'
import { useDispatch } from 'react-redux'
import { VisualizationSpec } from 'react-vega'
import { ExtendedVegaLite } from './vegaLite/ExtendedVegaLite'
import { setZoomedInPlot } from './webviewSlice'
import styles from './styles.module.scss'
import { changeDragAndDropMode } from './util'
import { zoomPlot } from '../util/messages'
import { useGetPlot } from '../hooks/useGetPlot'
import { Ellipsis } from '../../shared/components/icons'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'

interface ZoomablePlotProps {
  id: string
  onViewReady?: () => void
  currentSnapPoint: number
  section: PlotsSection
  shouldNotResize?: boolean
}

export const ZoomablePlot: React.FC<ZoomablePlotProps> = ({
  id,
  onViewReady,
  section
}) => {
  const spec = useGetPlot(section, id)
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
    <button
      className={styles.zoomablePlot}
      onClick={() => handleOnClick()}
      aria-label="Open Plot in Popup"
    >
      {
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
          data-testid="grip-icon"
          onMouseDown={() => changeDragAndDropMode(section, dispatch, false)}
        >
          <GripIcon className={styles.plotGripIcon} />
        </div>
      }
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
  )
}
