import reliefCamps from '../data/reliefCamps.json'

export const getReliefCamps = async (filters = {}) => {
  let results = [...reliefCamps]

  if (filters.district && filters.district !== 'all') {
    results = results.filter(
      (c) =>
        c.districtId === filters.district ||
        c.district.toLowerCase() === filters.district.toLowerCase()
    )
  }

  if (filters.query) {
    const q = filters.query.toLowerCase()
    results = results.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.summary || '').toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q)
    )
  }

  return results
}

export const getCampById = async (id) =>
  reliefCamps.find((c) => c.id === id) || null
