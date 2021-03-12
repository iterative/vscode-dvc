import React from 'react'

export const useOutsideClickHook = (
  el: React.RefObject<HTMLElement>,
  initialState: boolean
): [boolean, React.Dispatch<React.SetStateAction<boolean>>] => {
  const [isActive, setIsActive] = React.useState(initialState)

  React.useEffect(() => {
    const onClick = (e: Event) => {
      const activeElement = el.current
      if (activeElement && !activeElement.contains(e.target as HTMLElement)) {
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
