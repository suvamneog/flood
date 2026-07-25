import districts from '../data/districts.json'
import stats from '../data/stats.json'

export const getDistricts = async () => [...districts]

export const getDistrictById = async (id) =>
  districts.find((d) => d.id === id) || null

export const getStats = async () => ({ ...stats })
