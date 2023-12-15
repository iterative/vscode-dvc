import React, { ReactNode, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'

export const WithExpColumnNeedsShadowUpdates: React.FC<{
  children: ReactNode
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
}> = ({ root, setExpColumnNeedsShadow, children }) => {
  const [ref, needsShadow] = useInView({
    initialInView: true,
    root,
    rootMargin: '0px 0px 0px -2px',
    threshold: 1
  })

  useEffect(() => {
    setExpColumnNeedsShadow(needsShadow)
  }, [needsShadow, setExpColumnNeedsShadow])

  return <div ref={ref}>{children}</div>
}
