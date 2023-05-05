import { useEffect, useState } from 'react'
import { usePrevious } from './usePrevious'

export const useIsSectionComplete = (
  isSetup: boolean,
  hasReceivedMessageFromVsCode: boolean,
  onCompletion: () => void
) => {
  const [isComplete, setIsComplete] = useState<boolean | undefined>(undefined)
  const previousIsComplete = usePrevious(isComplete)

  useEffect(() => {
    if (isSetup) {
      setIsComplete(true)
    } else if (hasReceivedMessageFromVsCode) {
      setIsComplete(false)
    }
  }, [isSetup, hasReceivedMessageFromVsCode])

  useEffect(() => {
    if (isComplete && previousIsComplete === false) {
      onCompletion()
    }
  }, [isComplete, previousIsComplete, onCompletion])
}
