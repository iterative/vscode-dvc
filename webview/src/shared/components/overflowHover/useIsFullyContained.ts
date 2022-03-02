import { RefObject, useMemo } from 'react'

export const useIsFullyContained = (wrapperRef: RefObject<HTMLElement>) => {
  const { scrollWidth, clientWidth } = wrapperRef.current || {}
  return useMemo(
    () =>
      !(
        wrapperRef.current && (clientWidth as number) < (scrollWidth as number)
      ),
    [scrollWidth, clientWidth]
  )
}
