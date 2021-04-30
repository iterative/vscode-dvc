import React from 'react'

const addEventListeners = (
  onClick: (e: Event) => void,
  onEscape: (e: KeyboardEvent) => void
) => {
  window.addEventListener('click', onClick)
  window.addEventListener('keydown', onEscape)
}

const removeEventListeners = (
  onClick: (e: Event) => void,
  onEscape: (e: KeyboardEvent) => void
) => {
  window.removeEventListener('click', onClick)
  window.removeEventListener('keydown', onEscape)
}

export const useCloseActiveHook = (
  el: React.RefObject<HTMLElement>,
  initialState: boolean
): [boolean, React.Dispatch<React.SetStateAction<boolean>>] => {
  const [isActive, setIsActive] = React.useState(initialState)

  React.useEffect(() => {
    const onClick = (e: Event) => {
      const activeElement = el.current
      if (!activeElement?.contains(e.target as HTMLElement)) {
        setIsActive(!isActive)
      }
    }

    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsActive(!isActive)
      }
    }

    if (isActive) {
      addEventListeners(onClick, onEscape)
    }

    return () => {
      removeEventListeners(onClick, onEscape)
    }
  }, [isActive, el])

  return [isActive, setIsActive]
}
