import { ColorScale } from 'dvc/src/plots/webview/contract'
import React, { useMemo, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { createSpec } from './util'
import { ZoomablePlot } from '../ZoomablePlot'
import styles from '../styles.module.scss'
import { withScale } from '../../../util/styles'
import { plotDataStore } from '../plotDataStore'
import { PlotsState } from '../../store'

interface CheckpointPlotProps {
  id: string
  colors: ColorScale
  isLastOfRow?: boolean
  isLastRow?: boolean
}

export const CheckpointPlot: React.FC<CheckpointPlotProps> = ({
  id,
  colors,
  isLastOfRow,
  isLastRow
}) => {
  const plotSnapshot = useSelector(
    (state: PlotsState) => state.checkpoint.plotsSnapshots[id]
  )
  const [plot, setPlot] = useState(plotDataStore.checkpoint[id])
  const spec = useMemo(() => {
    const title = plot?.title
    if (!title) {
      return {}
    }
    return createSpec(title, colors)
  }, [plot?.title, colors])

  useEffect(() => {
    setPlot(plotDataStore.checkpoint[id])
  }, [plotSnapshot, id])

  if (!plot) {
    return null
  }

  const { values } = plot

  const key = `plot-${id}`

  return (
    <div className={styles.plot} data-testid={key} id={id} style={withScale(1)}>
      <ZoomablePlot
        spec={spec}
        data={{ values }}
        id={key}
        showVerticalResizer={!isLastOfRow}
        showHorizontalResizer={!isLastRow}
      />
    </div>
  )
}
