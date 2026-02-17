interface ConsentCheckboxProps {
  checked: boolean
  onChange: (value: boolean) => void
  onViewNotice: () => void
}

export function ConsentCheckbox({ checked, onChange, onViewNotice }: ConsentCheckboxProps) {
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id="privacy-consent"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300"
      />
      <label htmlFor="privacy-consent" className="text-sm leading-relaxed cursor-pointer">
        He le&iacute;do y acepto el{' '}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            onViewNotice()
          }}
          className="font-medium text-primary underline hover:text-primary/80"
        >
          Aviso de Privacidad
        </button>
        {' '}de conformidad con la LFPDPPP.
      </label>
    </div>
  )
}
