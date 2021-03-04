import { useState, useEffect } from 'react'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useOutsideClickHook = (el: any, initialState: boolean) => {
  const [isActive, setIsActive] = useState(initialState)

  useEffect(() => {
    const onClick = (e: Event) => {
      // If the active element exists and is clicked outside of the referenced component
      if (el.current !== null && !el.current.contains(e.target)) {
        setIsActive(!isActive)
      }
    }

    if (isActive) {
      window.addEventListener('click', onClick)
    }

    return () => {
      window.removeEventListener('click', onClick)
    }
  }, [isActive, el])

  return [isActive, setIsActive]
}
