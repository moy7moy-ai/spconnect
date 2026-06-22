'use client'

import { useEffect, useRef } from 'react'
import Button from './Button'

interface Props {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel  = 'Cancelar',
  danger       = false,
  loading      = false,
  onConfirm,
  onCancel,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    open ? el.showModal() : el.close()
  }, [open])

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className="rounded-2xl bg-white p-6 shadow-xl backdrop:bg-black/40 w-full max-w-sm"
      onCancel={onCancel}
    >
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
