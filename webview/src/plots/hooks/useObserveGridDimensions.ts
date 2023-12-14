import type { RefObject } from 'react'
import { useLayoutEffect } from 'react'
import { useDispatch } from 'react-redux'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { updateSectionDimensions as updateTemplateDimensions } from '../components/templatePlots/templatePlotsSlice'
import { updateSectionDimensions as updateCustomDimensions } from '../components/customPlots/customPlotsSlice'

const updateBySection: {
  [section: string]:
    | typeof updateTemplateDimensions
    | typeof updateCustomDimensions
} = {
  [PlotsSection.TEMPLATE_PLOTS]: updateTemplateDimensions,
  [PlotsSection.CUSTOM_PLOTS]: updateCustomDimensions
}

export const useObserveGridDimensions = (
  sectionKey: PlotsSection,
  ref: RefObject<HTMLElement>
): void => {
  const dispatch = useDispatch()

  useLayoutEffect(() => {
    const updateSectionDimensions = updateBySection[sectionKey]
    const resizeObserver = new ResizeObserver(() => {
      if (!updateSectionDimensions) {
        return
      }

      if (!ref.current) {
        dispatch(updateSectionDimensions({ sectionHeight: 0, sectionWidth: 0 }))
        return
      }

      const { height, width } = ref.current.getBoundingClientRect()

      dispatch(
        updateSectionDimensions({ sectionHeight: height, sectionWidth: width })
      )
    })

    if (ref.current) {
      resizeObserver.observe(ref.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [dispatch, ref, sectionKey])
}
