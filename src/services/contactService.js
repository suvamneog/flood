import contacts from '../data/contacts.json'

export const getContacts = async () =>
  [...contacts].sort((a, b) => a.priority - b.priority)

export const getSosContacts = async () =>
  [...contacts]
    .filter((c) => c.priority <= 5)
    .sort((a, b) => a.priority - b.priority)
