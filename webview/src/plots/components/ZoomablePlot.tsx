import { AnyAction } from '@reduxjs/toolkit'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { SpecWithTitles } from 'dvc/src/plots/vega/util'
import React, { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import VegaLite, { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { ZoomablePlotWrapper } from './ZoomablePlotWrapper'
import { TemplateVegaLite } from './templatePlots/TemplateVegaLite'
import { setZoomedInPlot } from './webviewSlice'
import styles from './styles.module.scss'
import { config } from './constants'
import { zoomPlot } from '../util/messages'
import { useGetPlot } from '../hooks/useGetPlot'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'
import { Ellipsis } from '../../shared/components/icons'

interface ZoomablePlotProps {
  spec?: SpecWithTitles
  id: string
  onViewReady?: () => void
  changeDisabledDragIds: (ids: string[]) => AnyAction
  currentSnapPoint: number
  section: PlotsSection
  shouldNotResize?: boolean
}

export const ZoomablePlot: React.FC<ZoomablePlotProps> = ({
  spec: createdSpec,
  id,
  onViewReady,
  section
}) => {
  const {
    data,
    content: spec,
    isTemplatePlot
  } = useGetPlot(section, id, createdSpec)
  const dispatch = useDispatch()
  const currentPlotProps = useRef<VegaLiteProps>()

  const plotProps: VegaLiteProps = {
    actions: false,
    config,
    data,
    'data-testid': `${id}-vega`,
    renderer: 'svg',
    spec
  } as VegaLiteProps
  currentPlotProps.current = plotProps

  useEffect(() => {
    dispatch(
      setZoomedInPlot({
        id,
        isTemplatePlot,
        plot: currentPlotProps.current,
        refresh: true
      })
    )
  }, [data, spec, dispatch, id, isTemplatePlot])

  const handleOnClick = (openActionsMenu?: boolean) => {
    zoomPlot()

    return dispatch(
      setZoomedInPlot({ id, isTemplatePlot, openActionsMenu, plot: plotProps })
    )
  }

  if (!data && !spec) {
    return null
  }

  const onNewView = () => {
    if (onViewReady) {
      onViewReady()
    }
  }

  return (
    <ZoomablePlotWrapper spec={plotProps.spec as SpecWithTitles}>
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
        {currentPlotProps.current &&
          (isTemplatePlot ? (
            <TemplateVegaLite
              vegaLiteProps={plotProps}
              id={id}
              onNewView={onNewView}
            />
          ) : (
            <VegaLite {...plotProps} onNewView={onNewView} />
          ))}
      </button>
    </ZoomablePlotWrapper>
  )
}
