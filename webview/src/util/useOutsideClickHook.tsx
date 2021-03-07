import React from 'react'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useOutsideClickHook = (el: any, initialState: boolean) => {
  const [isActive, setIsActive] = React.useState(initialState)

  React.useEffect(() => {
    const onClick = (e: Event) => {
      const activeElement = el.current
      if (activeElement && !activeElement.contains(e.target)) {
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
