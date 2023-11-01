import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { PlotHeight, PlotsSection } from 'dvc/src/plots/webview/contract'
import styles from './styles.module.scss'
import { changeSize as changeTemplatePlotsSize } from './templatePlots/templatePlotsSlice'
import { changeSize as changeCustomPlotsSize } from './customPlots/customPlotsSlice'
import { changeSize as changeImagesSize } from './comparisonTable/comparisonTableSlice'
import { Slider } from '../../shared/components/slider/Slider'
import { resizePlots } from '../util/messages'

interface SizeSlidersProps {
  maxNbPlotsPerRow: number
  height: number
  sectionKey: PlotsSection
  nbItemsPerRowOrWidth: number
  noHeight?: boolean
}

export const SizeSliders: React.FC<SizeSlidersProps> = ({
  maxNbPlotsPerRow,
  height,
  sectionKey,
  nbItemsPerRowOrWidth,
  noHeight
}) => {
  const dispatch = useDispatch()

  const handleResize = useCallback(
    (nbItems: number, newHeight: PlotHeight) => {
      const changeSize = {
        [PlotsSection.TEMPLATE_PLOTS]: changeTemplatePlotsSize,
        [PlotsSection.COMPARISON_TABLE]: changeImagesSize,
        [PlotsSection.CUSTOM_PLOTS]: changeCustomPlotsSize
      }
      const positiveNbItems = Math.abs(nbItems)
      dispatch(
        changeSize[sectionKey]({
          height: newHeight,
          nbItemsPerRowOrWidth: positiveNbItems
        })
      )
      resizePlots(newHeight, positiveNbItems, sectionKey)
    },
    [dispatch, sectionKey]
  )

  const plotHeights = Object.values(PlotHeight).filter(
    value => typeof value !== 'string'
  ) as number[]

  return (
    maxNbPlotsPerRow > 1 && (
      <div className={styles.sizeSliders} data-testid="size-sliders">
        <div className={styles.sizeSlider}>
          <Slider
            maximum={-1}
            minimum={-maxNbPlotsPerRow}
            label="Plot Width"
            onChange={nbItems => handleResize(nbItems, height)}
            defaultValue={-nbItemsPerRowOrWidth}
          />
        </div>
        {!noHeight && (
          <div className={styles.sizeSlider}>
            <Slider
              minimum={Math.min(...plotHeights)}
              maximum={Math.max(...plotHeights)}
              label="Plot Height"
              onChange={newHeight =>
                handleResize(
                  nbItemsPerRowOrWidth,
                  newHeight as unknown as PlotHeight
                )
              }
              defaultValue={height}
            />
          </div>
        )}
      </div>
    )
  )
}
