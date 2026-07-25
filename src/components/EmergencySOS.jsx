import { useState } from 'react'
import { Phone } from 'lucide-react'
import { motion } from 'framer-motion'
import Modal from './ui/Modal'
import { useFetch } from '../hooks/useFetch'
import { getSosContacts } from '../services/contactService'
import { telLink } from '../utils/helpers'

export default function EmergencySOS() {
  const [open, setOpen] = useState(false)
  const { data: contacts } = useFetch(getSosContacts, [])

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2 rounded-2xl bg-emergency px-4 py-3.5 font-bold text-white shadow-lg shadow-emergency/40 sm:right-6"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            '0 10px 25px -5px rgba(215,48,31,0.4)',
            '0 10px 35px -5px rgba(215,48,31,0.55)',
            '0 10px 25px -5px rgba(215,48,31,0.4)',
          ],
        }}
        transition={{ boxShadow: { duration: 2, repeat: Infinity } }}
        aria-label="Emergency SOS — open helpline list"
      >
        <Phone className="h-5 w-5" />
        <span className="text-sm tracking-wide">SOS</span>
      </motion.button>

      <Modal open={open} onClose={() => setOpen(false)} title="Emergency SOS" size="md">
        <p className="mb-5 text-sm text-slate-600 dark:text-slate-400">
          Tap a number below to call immediately. Stay calm and share your location.
        </p>
        <div className="grid gap-3">
          {(contacts || []).map((c) => (
            <a
              key={c.id}
              href={telLink(c.number)}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-slate-50 px-4 py-4 transition hover:border-emergency/40 hover:bg-emergency/5 active:scale-[0.99] dark:border-border-dark dark:bg-slate-800/50 dark:hover:bg-emergency/10 sm:px-5"
            >
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {c.description}
                </p>
              </div>
              <span className="shrink-0 rounded-xl bg-emergency px-4 py-2 text-base font-extrabold text-white sm:text-lg">
                {c.number}
              </span>
            </a>
          ))}
        </div>
      </Modal>
    </>
  )
}
