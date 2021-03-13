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

    const onEscape = (e: Event) => {
      if (e.keyCode === 27) {
        setIsActive(!isActive)
      }
    }

    if (isActive) {
      window.addEventListener('keydown', onClick)
      window.addEventListener('click', onEscape)
    }

    return () => {
      window.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onEscape)
    }
  }, [isActive, el])

  return [isActive, setIsActive]
}
