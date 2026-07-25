import updates from '../data/updates.json'

export const getUpdates = async () =>
  [...updates].sort((a, b) => new Date(b.date) - new Date(a.date))
