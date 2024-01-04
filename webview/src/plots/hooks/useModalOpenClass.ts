import { useEffect } from 'react'

export const useModalOpenClass = () => {
  useEffect(() => {
    const modalOpenClass = 'modalOpen'
    document.body.classList.add(modalOpenClass)

    return () => {
      document.body.classList.remove(modalOpenClass)
    }
  }, [])
}
