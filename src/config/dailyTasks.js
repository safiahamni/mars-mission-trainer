// DAILY TASKS: shown in the Start Hub checklist and as arrows on the map.
// PLACEHOLDER: Member 5 will replace these with the real daily science missions.
// A task counts as done when the player opens that station during the sol.
import { STATION_IDS } from './stations.js';

export const DAILY_TASKS = [
  { station: STATION_IDS.POWER, label: 'Check the battery at the Power Station' },
  { station: STATION_IDS.LIFE_SUPPORT, label: 'Make sure Life Support is running' },
  { station: STATION_IDS.GREENHOUSE, label: 'Check on the crops in the Greenhouse' },
  { station: STATION_IDS.SCIENCE_LAB, label: 'Do an experiment in the Science Lab' },
];