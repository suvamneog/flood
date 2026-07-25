import floodReports from '../data/floodReports.json'

export const getFloodReports = async (filters = {}) => {
  let results = [...floodReports]

  if (filters.district && filters.district !== 'all') {
    results = results.filter(
      (r) =>
        r.districtId === filters.district ||
        r.district.toLowerCase() === filters.district.toLowerCase()
    )
  }

  if (filters.status && filters.status !== 'all') {
    results = results.filter((r) => r.status === filters.status)
  }

  return results
}

export const getFloodReportById = async (id) =>
  floodReports.find((r) => r.id === id) || null
