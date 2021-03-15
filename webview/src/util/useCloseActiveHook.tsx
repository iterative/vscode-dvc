import React from 'react'

export const useCloseActiveHook = (
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

    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsActive(!isActive)
      }
    }

    if (isActive) {
      window.addEventListener('click', onClick)
      window.addEventListener('keydown', onEscape)
    }

    return () => {
      window.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onEscape)
    }
  }, [isActive, el])

  return [isActive, setIsActive]
}
