import React, { createRef, KeyboardEvent, useEffect } from 'react'
import styles from './styles.module.scss'

interface SectionRenamerProps {
  defaultTitle: string
  onChangeTitle: (title: string) => void
}

export const SectionRenamer: React.FC<SectionRenamerProps> = ({
  defaultTitle,
  onChangeTitle
}) => {
  const inputRef = createRef<HTMLInputElement>()
  useEffect(() => {
    inputRef.current?.focus()
  }, [inputRef])

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const space = ' '
    if (e.key === space) {
      e.preventDefault()
      e.currentTarget.value += space
    }
    e.key === 'Enter' && onChangeTitle(e.currentTarget.value)
  }

  return (
    <input
      className={styles.sectionRenamer}
      ref={inputRef}
      defaultValue={defaultTitle}
      onKeyDown={onKeyDown}
    />
  )
}
