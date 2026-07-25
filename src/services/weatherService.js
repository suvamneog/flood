import weather from '../data/weather.json'

/** River & flood-impact alerts sourced from ASDMA / CWC daily report. */
export const getWeatherAlerts = async () => [...weather]
