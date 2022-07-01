import React, { MouseEvent, useEffect } from 'react'
import styles from './styles.module.scss'
import { Icon } from '../Icon'
import { Close } from '../icons'

interface ModalProps {
  onClose: () => void
  children?: React.ReactNode
}

export const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  useEffect(() => {
    const checkKeyAndClose = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', checkKeyAndClose)

    return () => {
      window.removeEventListener('keydown', checkKeyAndClose)
    }
  }, [onClose])
  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="none"
      data-testid="modal"
    >
      <div className={styles.modal}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          data-testid="modal-close"
        >
          <Icon icon={Close} width={30} height={30} />
        </button>
        <div
          className={styles.modalContent}
          role="none"
          onClick={(e: MouseEvent) => e.stopPropagation()}
          data-testid="modal-content"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
