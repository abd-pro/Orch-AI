'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/** Champ mot de passe avec bouton œil pour révéler/masquer la saisie. */
export default function PasswordField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className="w-full bg-[#09090b] border border-[#3f3f46] rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#cf7d56] transition-colors placeholder:text-[#52525b]"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        tabIndex={-1}
        aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#a1a1aa] transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
