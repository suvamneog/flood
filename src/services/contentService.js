import safetyTips from '../data/safetyTips.json'
import checklist from '../data/checklist.json'

export const getSafetyTips = async () => [...safetyTips]

export const getChecklistItems = async () => [...checklist]
