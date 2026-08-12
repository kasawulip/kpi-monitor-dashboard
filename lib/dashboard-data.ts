// Realistic mock data for the DRO 100-Day Performance Exercise dashboard.
// All figures are illustrative placeholders for a pilot/prototype.

export type Status = 'good' | 'warning' | 'critical'

export type ProgrammeId = 'card-issuance' | 'nid-registration' | 'opencrvs'

export interface Programme {
  id: ProgrammeId
  name: string
  shortName: string
  unitLabel: string // e.g. "cards issued"
  targetPerRaDay: number
}

export interface DateRange {
  id: 'today' | 'yesterday' | '7d' | '30d' | 'exercise'
  label: string
}

export interface Kpi {
  key: string
  label: string
  value: string
  caption: string
  status?: Status
  emphasis?: boolean
}

export interface RegionPerf {
  name: string
  short: string
  achievement: number // percent
  achieved: number
  target: number
  activeRas: number
}

export interface DistrictRow {
  district: string
  region: string
  output: number
  target: number
  achievement: number
  rasReporting: number
  rasTotal: number
  status: Status
}

export const programmes: Programme[] = [
  {
    id: 'card-issuance',
    name: 'Card Issuance',
    shortName: 'Cards',
    unitLabel: 'cards issued',
    targetPerRaDay: 40,
  },
  {
    id: 'nid-registration',
    name: 'NID / NIN Registration',
    shortName: 'NID/NIN',
    unitLabel: 'registrations',
    targetPerRaDay: 55,
  },
  {
    id: 'opencrvs',
    name: 'OpenCRVS Notification',
    shortName: 'OpenCRVS',
    unitLabel: 'notifications',
    targetPerRaDay: 30,
  },
]

export const dateRanges: DateRange[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'exercise', label: 'Entire exercise' },
]

export const regionNames = [
  'Central Region',
  'Eastern Region',
  'Mid Western Region',
  'North Eastern Region',
  'North Western Region',
  'Western Region',
]

// Stable string hash (FNV-1a) for well-spread seeds.
function hashString(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Deterministic pseudo-random generator so figures are stable per render.
function seeded(seed: number) {
  let s = (seed >>> 0) % 2147483647
  if (s <= 0) s += 2147483646
  const next = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
  // Warm up to decorrelate the first outputs from the seed.
  for (let i = 0; i < 5; i++) next()
  return next
}

function statusFor(pct: number): Status {
  if (pct >= 80) return 'good'
  if (pct >= 50) return 'warning'
  return 'critical'
}

// Base achievement multiplier per programme, so each programme feels distinct.
const programmeFactor: Record<ProgrammeId, number> = {
  'card-issuance': 0.55,
  'nid-registration': 0.82,
  opencrvs: 0.67,
}

// Date-range factor: shorter windows show today's slice, longer windows accumulate.
const rangeFactor: Record<DateRange['id'], number> = {
  today: 1,
  yesterday: 0.97,
  '7d': 1.04,
  '30d': 1.09,
  exercise: 1,
}

export const districtsByRegion: Record<string, string[]> = {
  'Central Region': ['Kampala Central', 'Wakiso', 'Mukono', 'Mpigi', 'Luweero', 'Nakaseke'],
  'Eastern Region': ['Jinja', 'Mbale', 'Soroti', 'Tororo', 'Iganga', 'Kumi'],
  'Mid Western Region': ['Hoima', 'Masindi', 'Kibaale', 'Kagadi', 'Buliisa', 'Kakumiro'],
  'North Eastern Region': ['Moroto', 'Kotido', 'Kaabong', 'Napak', 'Amudat', 'Nakapiripirit'],
  'North Western Region': ['Arua', 'Gulu', 'Lira', 'Nebbi', 'Yumbe', 'Koboko'],
  'Western Region': ['Mbarara', 'Kasese', 'Kabale', 'Bushenyi', 'Fort Portal', 'Ntungamo'],
}

export interface DashboardData {
  programme: Programme
  scopeLabel: string
  kpis: Kpi[]
  regions: RegionPerf[]
  leaderboard: RegionPerf[]
  districts: DistrictRow[]
  nationalAchievement: number
  nationalStatus: Status
  totalOutput: number
  districtsWithEntries: number
  districtsTotal: number
}

function fmt(n: number) {
  return n.toLocaleString('en-US')
}

export function getDashboardData(
  programmeId: ProgrammeId,
  regionName: string | null,
  range: DateRange['id'],
): DashboardData {
  const programme = programmes.find((p) => p.id === programmeId) ?? programmes[0]
  const seedBase = hashString(`${programme.id}|${regionName ?? 'national'}|${range}`)
  const rand = seeded(seedBase)
  const baseFactor = programmeFactor[programme.id] * rangeFactor[range]

  const scopedRegions = regionName ? [regionName] : regionNames

  const regions: RegionPerf[] = scopedRegions.map((name) => {
    const variance = (rand() - 0.5) * 0.35
    const pct = Math.max(6, Math.min(97, (baseFactor + variance) * 100))
    const activeRas = Math.round(120 + rand() * 260)
    const target = Math.round(activeRas * programme.targetPerRaDay)
    const achieved = Math.round(target * (pct / 100))
    return {
      name,
      short: name.replace(' Region', '').toUpperCase(),
      achievement: Math.round(pct * 10) / 10,
      achieved,
      target,
      activeRas,
    }
  })

  const totalTarget = regions.reduce((s, r) => s + r.target, 0)
  const totalAchieved = regions.reduce((s, r) => s + r.achieved, 0)
  const nationalAchievement = Math.round((totalAchieved / totalTarget) * 1000) / 10
  const nationalStatus = statusFor(nationalAchievement)
  const totalActiveRas = regions.reduce((s, r) => s + r.activeRas, 0)
  const dailyTarget = totalActiveRas * programme.targetPerRaDay
  const projected = Math.round(nationalAchievement * 1.02 * 100) / 100

  const cumulativeTarget = dailyTarget * 100
  const cumulativeAchieved = Math.round(cumulativeTarget * (nationalAchievement / 100))
  const remaining = cumulativeTarget - cumulativeAchieved

  const kpis: Kpi[] = [
    {
      key: 'completion',
      label: 'Completion rate',
      value: `${nationalAchievement}%`,
      caption: 'Cumulative achieved vs. expected to date',
      status: nationalStatus,
      emphasis: true,
    },
    {
      key: 'projected',
      label: 'Projected completion',
      value: `${projected}%`,
      caption: 'At current pace, by Day 100',
      status: statusFor(projected),
    },
    {
      key: 'daily-target',
      label: 'Daily target',
      value: fmt(dailyTarget),
      caption: `Expected ${programme.unitLabel} today`,
    },
    {
      key: 'achieved',
      label: 'Achieved to date',
      value: fmt(cumulativeAchieved),
      caption: 'Cumulative actual output',
    },
    {
      key: 'remaining',
      label: 'Remaining',
      value: fmt(remaining),
      caption: 'To reach cumulative target',
    },
    {
      key: 'target-per-ra',
      label: 'Target per RA / day',
      value: fmt(programme.targetPerRaDay),
      caption: 'Fixed by PRO-IS, per programme',
    },
  ]

  const leaderboard = [...regions].sort((a, b) => b.achievement - a.achievement)

  // District rows for the selected scope.
  const districtRegions = regionName ? [regionName] : regionNames
  const districts: DistrictRow[] = districtRegions.flatMap((rName) => {
    const list = districtsByRegion[rName] ?? []
    return list.map((district) => {
      const dRand = seeded(hashString(`${district}|${rName}|${programme.id}|${range}`))
      const variance = (dRand() - 0.5) * 0.5
      const pct = Math.max(0, Math.min(99, (baseFactor + variance) * 100))
      const rasTotal = Math.round(8 + dRand() * 34)
      const rasReporting = Math.round(rasTotal * (0.4 + dRand() * 0.6))
      const target = rasTotal * programme.targetPerRaDay
      const output = Math.round(target * (pct / 100))
      return {
        district,
        region: rName,
        output,
        target,
        achievement: Math.round(pct * 10) / 10,
        rasReporting,
        rasTotal,
        status: statusFor(pct),
      }
    })
  })

  const totalOutput = districts.reduce((s, d) => s + d.output, 0)
  const districtsWithEntries = districts.filter((d) => d.rasReporting > 0).length

  return {
    programme,
    scopeLabel: regionName ?? 'National',
    kpis,
    regions,
    leaderboard,
    districts,
    nationalAchievement,
    nationalStatus,
    totalOutput,
    districtsWithEntries,
    districtsTotal: districts.length,
  }
}

/* -------------------------------------------------------------------------- */
/* DRO (District Registration Officer) — single assigned district scope       */
/* -------------------------------------------------------------------------- */

// The signed-in officer for this prototype. A DRO is bound to one district.
export const droContext = {
  officerName: 'Nabirye Sarah',
  role: 'DRO' as const,
  roleLabel: 'District Registration Officer',
  region: 'Eastern Region',
  district: 'Tororo',
  officeCode: 'NIRA/EAS/TOR',
}

export interface DistrictSummary {
  programme: Programme
  scopeLabel: string
  kpis: Kpi[]
  achievement: number
  status: Status
  achieved: number
  target: number
  activeRas: number
  rasReporting: number
  rasTotal: number
  dailyTarget: number
}

function districtStats(programme: Programme, region: string, district: string) {
  const dRand = seeded(hashString(`${district}|${region}|${programme.id}|exercise`))
  const baseFactor = programmeFactor[programme.id]
  const variance = (dRand() - 0.5) * 0.5
  const pct = Math.max(6, Math.min(98, (baseFactor + variance) * 100))
  const rasTotal = Math.round(14 + dRand() * 22)
  const rasReporting = Math.round(rasTotal * (0.55 + dRand() * 0.4))
  const dailyTarget = rasTotal * programme.targetPerRaDay
  const cumulativeTarget = dailyTarget * 100
  const achieved = Math.round(cumulativeTarget * (pct / 100))
  return {
    pct: Math.round(pct * 10) / 10,
    rasTotal,
    rasReporting: Math.min(rasReporting, rasTotal),
    dailyTarget,
    cumulativeTarget,
    achieved,
  }
}

// District-scoped dashboard for a single district (the DRO's view).
export function getDistrictSummary(
  programmeId: ProgrammeId,
  region: string,
  district: string,
): DistrictSummary {
  const programme = programmes.find((p) => p.id === programmeId) ?? programmes[0]
  const { pct, rasTotal, rasReporting, dailyTarget, cumulativeTarget, achieved } = districtStats(
    programme,
    region,
    district,
  )
  const status = statusFor(pct)
  const remaining = Math.max(0, cumulativeTarget - achieved)
  const projected = Math.round(pct * 1.02 * 10) / 10

  const kpis: Kpi[] = [
    {
      key: 'completion',
      label: 'Completion rate',
      value: `${pct}%`,
      caption: 'Cumulative achieved vs. expected to date',
      status,
      emphasis: true,
    },
    {
      key: 'projected',
      label: 'Projected completion',
      value: `${projected}%`,
      caption: 'At current pace, by Day 100',
      status: statusFor(projected),
    },
    {
      key: 'daily-target',
      label: 'Daily target',
      value: fmt(dailyTarget),
      caption: `Expected ${programme.unitLabel} today`,
    },
    {
      key: 'achieved',
      label: 'Achieved to date',
      value: fmt(achieved),
      caption: 'Cumulative actual output',
    },
    {
      key: 'remaining',
      label: 'Remaining',
      value: fmt(remaining),
      caption: 'To reach cumulative target',
    },
    {
      key: 'ras-reporting',
      label: 'RAs reporting today',
      value: `${rasReporting}/${rasTotal}`,
      caption: 'Registration assistants with an entry',
      status: statusFor((rasReporting / rasTotal) * 100),
    },
  ]

  return {
    programme,
    scopeLabel: `${district}, ${region.replace(' Region', '')}`,
    kpis,
    achievement: pct,
    status,
    achieved,
    target: cumulativeTarget,
    activeRas: rasTotal,
    rasReporting,
    rasTotal,
    dailyTarget,
  }
}

// Per-programme summary cards for a single district (reuses ProgrammeSummary shape).
export function getDistrictProgrammeSummaries(
  region: string,
  district: string,
): ProgrammeSummary[] {
  return programmes.map((p) => {
    const s = getDistrictSummary(p.id, region, district)
    return {
      id: p.id,
      name: p.name,
      shortName: p.shortName,
      unitLabel: p.unitLabel,
      achievement: s.achievement,
      status: s.status,
      achieved: s.achieved,
      target: s.target,
      activeRas: s.activeRas,
    }
  })
}

/* -------------------------------------------------------------------------- */
/* District Detail — per-district daily indicators for a programme + date     */
/* Used by PRO-IS / SRO drill-down. Programme-specific and selected-date aware.*/
/* -------------------------------------------------------------------------- */

export type DailyStatus = Status | 'none'

export interface DistrictDailyRow {
  district: string
  region: string
  // Authoritative programme-specific active RA establishment applicable on the date.
  noOfRas: number
  // Of those RAs, how many submitted an entry for the selected date.
  rasSubmitted: number
  // No of RAs that did not submit an entry for the selected date.
  rasWithoutEntry: number
  // Sum of RA output captured for the selected date.
  dailyOutput: number
  // No of RAs x per-RA daily target (fixed by PRO-IS per programme).
  dailyTarget: number
  // dailyOutput / dailyTarget, one decimal place.
  achievement: number
  // dailyOutput / noOfRas, one decimal place (0.0 when noOfRas is 0).
  avgPerRa: number
  status: DailyStatus
}

// Per-district daily rows for a programme on a selected reporting date.
// regionScope optionally limits the rows to a single region (e.g. an SRO's region).
export function getDistrictDailyRows(
  programmeId: ProgrammeId,
  dateISO: string,
  regionScope?: string,
): DistrictDailyRow[] {
  const programme = programmes.find((p) => p.id === programmeId) ?? programmes[0]
  const regions = regionScope ? [regionScope] : regionNames
  return regions.flatMap((rName) =>
    (districtsByRegion[rName] ?? []).map((district) => {
      // Authoritative programme-specific establishment for this district/date.
      const noOfRas = getDistrictRas(programmeId, rName, district).length
      const rand = seeded(hashString(`daily|${district}|${rName}|${programmeId}|${dateISO}`))

      // ~22% of district-days record no entries at all ("No entries").
      const noEntriesDay = rand() < 0.22
      const rasSubmitted = noEntriesDay
        ? 0
        : Math.min(noOfRas, Math.round(noOfRas * (0.35 + rand() * 0.65)))
      const rasWithoutEntry = noOfRas - rasSubmitted

      // Output only comes from RAs that submitted; per-RA output varies around target.
      const perRaOutput = programme.targetPerRaDay * (0.45 + rand() * 0.85)
      const dailyOutput = Math.round(rasSubmitted * perRaOutput)
      const dailyTarget = noOfRas * programme.targetPerRaDay

      const achievement = dailyTarget
        ? Math.round((dailyOutput / dailyTarget) * 1000) / 10
        : 0
      const avgPerRa = noOfRas ? Math.round((dailyOutput / noOfRas) * 10) / 10 : 0
      const status: DailyStatus = rasSubmitted === 0 ? 'none' : statusFor(achievement)

      return {
        district,
        region: rName,
        noOfRas,
        rasSubmitted,
        rasWithoutEntry,
        dailyOutput,
        dailyTarget,
        achievement,
        avgPerRa,
        status,
      }
    }),
  )
}

export interface ProgrammeSummary {
  id: ProgrammeId
  name: string
  shortName: string
  unitLabel: string
  achievement: number
  status: Status
  achieved: number
  target: number
  activeRas: number
}

/* -------------------------------------------------------------------------- */
/* Daily data entry lookups (RAs + non-working reasons) — DRO workflow        */
/* -------------------------------------------------------------------------- */

export interface RaOption {
  id: string
  name: string
  code: string
  programmeId: ProgrammeId
}

export interface NonWorkingReason {
  code: string
  name: string
  description: string
  commentRequired: boolean
}

// Mirrors the reference project's non-working-day reason catalogue.
export const nonWorkingReasons: NonWorkingReason[] = [
  {
    code: 'PUBLIC_HOLIDAY',
    name: 'Public holiday',
    description: 'A gazetted national or public holiday on which the programme did not operate.',
    commentRequired: false,
  },
  {
    code: 'EQUIPMENT_FAILURE',
    name: 'Equipment / kit failure',
    description: 'Registration kits or biometric equipment were non-functional district-wide.',
    commentRequired: true,
  },
  {
    code: 'POWER_OUTAGE',
    name: 'Power outage',
    description: 'Sustained loss of power prevented all operations for the day.',
    commentRequired: true,
  },
  {
    code: 'SECURITY',
    name: 'Security / civil disturbance',
    description: 'Insecurity or civil disturbance made operations unsafe across the district.',
    commentRequired: true,
  },
  {
    code: 'WEATHER',
    name: 'Severe weather / flooding',
    description: 'Extreme weather blocked access to registration points district-wide.',
    commentRequired: true,
  },
  {
    code: 'OTHER',
    name: 'Other (explain)',
    description: 'Any other district-wide reason not covered above.',
    commentRequired: true,
  },
]

// Stable list of active RAs for a district on a given programme.
export function getDistrictRas(
  programmeId: ProgrammeId,
  region: string,
  district: string,
): RaOption[] {
  const rand = seeded(hashString(`ras|${district}|${region}|${programmeId}`))
  const rCode = regionCode[region] ?? region.slice(0, 3).toUpperCase()
  const dCode = districtCode(district)
  const count = 10 + Math.floor(rand() * 10) // 10–19 RAs per programme
  const usedSeq = new Set<number>()
  const list: RaOption[] = []
  for (let i = 0; i < count; i++) {
    const surname = raSurnames[Math.floor(rand() * raSurnames.length)]
    const given = raGivenNames[Math.floor(rand() * raGivenNames.length)]
    let seq = 1 + Math.floor(rand() * 120)
    while (usedSeq.has(seq)) seq = (seq % 120) + 1
    usedSeq.add(seq)
    const code = `NIRA/${rCode}/${dCode}/RA/${String(seq).padStart(3, '0')}`
    list.push({ id: code, name: `${surname} ${given}`, code, programmeId })
  }
  return list.sort((a, b) => a.name.localeCompare(b.name))
}

// National cumulative summary for every programme — powers the overview band.
export function getProgrammeSummaries(): ProgrammeSummary[] {
  return programmes.map((p) => {
    const d = getDashboardData(p.id, null, 'exercise')
    const achieved = d.regions.reduce((s, r) => s + r.achieved, 0)
    const target = d.regions.reduce((s, r) => s + r.target, 0)
    const activeRas = d.regions.reduce((s, r) => s + r.activeRas, 0)
    return {
      id: p.id,
      name: p.name,
      shortName: p.shortName,
      unitLabel: p.unitLabel,
      achievement: d.nationalAchievement,
      status: d.nationalStatus,
      achieved,
      target,
      activeRas,
    }
  })
}

/* -------------------------------------------------------------------------- */
/* District daily snapshot (region → district → programme → date drill-down)  */
/* -------------------------------------------------------------------------- */

export interface RaDetail {
  name: string
  regNo: string
  captured: number
}

export interface DaySnapshot {
  dateISO: string
  dateLabel: string
  captureNoun: string
  totalCaptured: number
  avgPerRa: number
  rasWithEntry: number
  rasWithoutEntry: number
  rasTotal: number
  ras: RaDetail[]
}

const captureNoun: Record<ProgrammeId, string> = {
  'card-issuance': 'cards issued',
  'nid-registration': 'registrations',
  opencrvs: 'notifications',
}

const regionCode: Record<string, string> = {
  'Central Region': 'CEN',
  'Eastern Region': 'EAS',
  'Mid Western Region': 'MDW',
  'North Eastern Region': 'NEA',
  'North Western Region': 'NWE',
  'Western Region': 'WES',
}

const raSurnames = [
  'MUKODIRI', 'AKUMU', 'OKELLO', 'NAKATO', 'WASSWA', 'ATIM', 'OPIO', 'NABIRYE',
  'SSALI', 'KATO', 'BABIRYE', 'OCEN', 'ADONG', 'MUGISHA', 'TUMUSIIME', 'SSEMPALA',
  'NALUBEGA', 'OJOK', 'ACHAN', 'KIZZA', 'NANTEZA', 'WANYAMA', 'NAMUTEBI', 'EKAU',
  'LOKO', 'KEMIGISHA', 'NAMPIJJA', 'SSEBUGWAWO', 'ANGOM', 'OWORI',
]

const raGivenNames = [
  'BARBRA', 'PAULA VERONICA', 'JOSEPH', 'MARY', 'GRACE', 'PETER', 'SARAH',
  'DAVID', 'ESTHER', 'JAMES', 'RUTH', 'SAMUEL', 'FAITH', 'MOSES', 'JOAN',
  'RONALD', 'BRENDA', 'ISAAC', 'DORCUS', 'SIMON', 'PATIENCE', 'ALLAN',
  'HARRIET', 'TIMOTHY', 'REBECCA', 'DENIS',
]

const monthShort = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatSnapshotDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${monthShort[m - 1]} ${y}`
}

function districtCode(name: string) {
  return name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()
}

export function getDaySnapshot(
  programmeId: ProgrammeId,
  region: string,
  district: string,
  dateISO: string,
): DaySnapshot {
  const programme = programmes.find((p) => p.id === programmeId) ?? programmes[0]
  const noun = captureNoun[programme.id]
  const rand = seeded(hashString(`${district}|${region}|${programme.id}|${dateISO}`))

  const rasTotal = 12 + Math.floor(rand() * 16) // 12–27 RAs
  const rCode = regionCode[region] ?? region.slice(0, 3).toUpperCase()
  const dCode = districtCode(district)

  const usedSeq = new Set<number>()
  const ras: RaDetail[] = []
  for (let i = 0; i < rasTotal; i++) {
    const surname = raSurnames[Math.floor(rand() * raSurnames.length)]
    const given = raGivenNames[Math.floor(rand() * raGivenNames.length)]
    let seq = 1 + Math.floor(rand() * 120)
    while (usedSeq.has(seq)) seq = (seq % 120) + 1
    usedSeq.add(seq)
    const hasEntry = rand() > 0.14
    const captured = hasEntry
      ? Math.max(1, Math.round(programme.targetPerRaDay * (0.5 + rand() * 0.95)))
      : 0
    ras.push({
      name: `${surname} ${given}`,
      regNo: `NIRA/${rCode}/${dCode}/RA/${String(seq).padStart(3, '0')}`,
      captured,
    })
  }

  const totalCaptured = ras.reduce((s, r) => s + r.captured, 0)
  const rasWithEntry = ras.filter((r) => r.captured > 0).length
  const rasWithoutEntry = rasTotal - rasWithEntry
  const avgPerRa = rasWithEntry ? Math.round(totalCaptured / rasWithEntry) : 0

  ras.sort((a, b) => b.captured - a.captured || a.name.localeCompare(b.name))

  return {
    dateISO,
    dateLabel: formatSnapshotDate(dateISO),
    captureNoun: noun,
    totalCaptured,
    avgPerRa,
    rasWithEntry,
    rasWithoutEntry,
    rasTotal,
    ras,
  }
}

/* -------------------------------------------------------------------------- */
/* PRO-IS (programme super-admin) — panel mock data + helpers                 */
/* -------------------------------------------------------------------------- */

export const programmeCode: Record<ProgrammeId, string> = {
  'card-issuance': 'CARD-ISS',
  'nid-registration': 'NIN-REG',
  opencrvs: 'OCRVS-NT',
}

export type ProgrammeStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED_NATIONALLY'
  | 'ADMINISTRATIVELY_COMPLETED'
  | 'CLOSED'

export const programmeStatuses: { value: ProgrammeStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED_NATIONALLY', label: 'Paused nationally' },
  { value: 'ADMINISTRATIVELY_COMPLETED', label: 'Admin completed' },
  { value: 'CLOSED', label: 'Closed' },
]

export interface TargetHistoryEntry {
  id: string
  changedAt: string
  changedBy: string
  summary: string
}

export interface ProgrammeConfig {
  id: ProgrammeId
  name: string
  code: string
  dailyTargetPerRa: number
  workingDaysPerWeek: number
  workingDays: number
  durationDays: number
  startDate: string
  endDate: string
  requiredOperationalDays: number
  status: ProgrammeStatus
  version: number
  active: boolean
  history: TargetHistoryEntry[]
}

export function getProgrammeConfigs(): ProgrammeConfig[] {
  const startDate = '2026-06-01'
  const endDate = '2026-09-08'
  const statuses: ProgrammeStatus[] = ['ACTIVE', 'ACTIVE', 'SCHEDULED']
  return programmes.map((p, i) => ({
    id: p.id,
    name: p.name,
    code: programmeCode[p.id],
    dailyTargetPerRa: p.targetPerRaDay,
    workingDaysPerWeek: 6,
    workingDays: 86,
    durationDays: 100,
    startDate,
    endDate,
    requiredOperationalDays: 100,
    status: statuses[i],
    version: 3 + i,
    active: true,
    history: [
      {
        id: `${p.id}-h1`,
        changedAt: '2026-05-20T09:12:00Z',
        changedBy: 'a.mwanga (PRO-IS)',
        summary: `Set daily target to ${p.targetPerRaDay}/RA and duration to 100 days`,
      },
      {
        id: `${p.id}-h2`,
        changedAt: '2026-06-01T06:30:00Z',
        changedBy: 'a.mwanga (PRO-IS)',
        summary: 'Exercise window opened; status → ACTIVE',
      },
    ],
  }))
}

export type UserRole = 'PRO-IS' | 'SRO-FS' | 'DRO'

export interface AdminUser {
  id: string
  username: string
  fullName: string
  role: UserRole
  regionName: string | null
  districtName: string | null
  isActive: boolean
  mustChangePassword: boolean
}

export function getAdminUsers(): AdminUser[] {
  const seeds: Omit<AdminUser, 'id'>[] = [
    { username: 'a.mwanga', fullName: 'Aloysius Mwanga', role: 'PRO-IS', regionName: null, districtName: null, isActive: true, mustChangePassword: false },
    { username: 's.nabirye', fullName: 'Sarah Nabirye', role: 'DRO', regionName: 'Eastern Region', districtName: 'Tororo', isActive: true, mustChangePassword: false },
    { username: 'j.okello', fullName: 'Joseph Okello', role: 'SRO-FS', regionName: 'Eastern Region', districtName: null, isActive: true, mustChangePassword: false },
    { username: 'g.atim', fullName: 'Grace Atim', role: 'SRO-FS', regionName: 'North Eastern Region', districtName: null, isActive: true, mustChangePassword: true },
    { username: 'p.wasswa', fullName: 'Peter Wasswa', role: 'DRO', regionName: 'Central Region', districtName: 'Mukono', isActive: true, mustChangePassword: false },
    { username: 'r.kemigisha', fullName: 'Ruth Kemigisha', role: 'DRO', regionName: 'Western Region', districtName: 'Mbarara', isActive: false, mustChangePassword: false },
    { username: 'd.ojok', fullName: 'Denis Ojok', role: 'DRO', regionName: 'North Western Region', districtName: 'Gulu', isActive: true, mustChangePassword: true },
    { username: 'h.namutebi', fullName: 'Harriet Namutebi', role: 'SRO-FS', regionName: 'Central Region', districtName: null, isActive: true, mustChangePassword: false },
    { username: 'i.kizza', fullName: 'Isaac Kizza', role: 'DRO', regionName: 'Mid Western Region', districtName: 'Hoima', isActive: true, mustChangePassword: false },
    { username: 't.mugisha', fullName: 'Timothy Mugisha', role: 'DRO', regionName: 'Western Region', districtName: 'Kabale', isActive: false, mustChangePassword: false },
  ]
  return seeds.map((u, i) => ({ id: `user-${i + 1}`, ...u }))
}

export interface Suspension {
  id: string
  programmeId: ProgrammeId
  programmeName: string
  programmeCode: string
  startDate: string
  endDate: string | null
  reason: string | null
}

export function getSuspensions(): Suspension[] {
  return [
    {
      id: 'susp-1',
      programmeId: 'opencrvs',
      programmeName: 'OpenCRVS Notification',
      programmeCode: programmeCode.opencrvs,
      startDate: '2026-06-09',
      endDate: '2026-06-09',
      reason: 'Heroes Day public holiday',
    },
    {
      id: 'susp-2',
      programmeId: 'card-issuance',
      programmeName: 'Card Issuance',
      programmeCode: programmeCode['card-issuance'],
      startDate: '2026-08-01',
      endDate: null,
      reason: 'Card personalisation system upgrade',
    },
    {
      id: 'susp-3',
      programmeId: 'nid-registration',
      programmeName: 'NID / NIN Registration',
      programmeCode: programmeCode['nid-registration'],
      startDate: '2026-07-15',
      endDate: '2026-07-16',
      reason: 'Nationwide kit firmware update',
    },
  ]
}

export interface AuditLogEntry {
  id: string
  createdAt: string
  action: string
  actorUsername: string
  actorRole: UserRole
  entityType: string
  entityId: string
  ip: string
  metadata: Record<string, unknown>
}

export const auditActions = [
  'LOGIN',
  'USER_CREATED',
  'PASSWORD_RESET',
  'TARGET_UPDATED',
  'PROGRAMME_STATUS_CHANGED',
  'SUSPENSION_CREATED',
  'SUSPENSION_CANCELLED',
  'RA_REPLACED',
  'REPORT_GENERATED',
]

export function getAuditLogs(): AuditLogEntry[] {
  const rand = seeded(hashString('audit-log-seed'))
  const actors: { u: string; r: UserRole }[] = [
    { u: 'a.mwanga', r: 'PRO-IS' },
    { u: 'j.okello', r: 'SRO-FS' },
    { u: 's.nabirye', r: 'DRO' },
    { u: 'h.namutebi', r: 'SRO-FS' },
    { u: 'p.wasswa', r: 'DRO' },
  ]
  const entities = ['user', 'programme', 'suspension', 'ra', 'report', 'session']
  const rows: AuditLogEntry[] = []
  const base = Date.parse('2026-06-30T16:40:00Z')
  for (let i = 0; i < 42; i++) {
    const actor = actors[Math.floor(rand() * actors.length)]
    const action = auditActions[Math.floor(rand() * auditActions.length)]
    const entity = entities[Math.floor(rand() * entities.length)]
    const ts = new Date(base - i * (37 * 60 * 1000 + Math.floor(rand() * 900000)))
    rows.push({
      id: `audit-${String(i + 1).padStart(3, '0')}`,
      createdAt: ts.toISOString(),
      action,
      actorUsername: actor.u,
      actorRole: actor.r,
      entityType: entity,
      entityId: `${entity}-${Math.floor(rand() * 9000 + 1000)}`,
      ip: `10.${Math.floor(rand() * 250)}.${Math.floor(rand() * 250)}.${Math.floor(rand() * 250)}`,
      metadata: {
        action,
        actor: actor.u,
        note: 'Illustrative audit metadata for the prototype.',
      },
    })
  }
  return rows
}

// National headline stats for the PRO-IS overview hero band.
export function getNationalStats() {
  const summaries = getProgrammeSummaries()
  const achieved = summaries.reduce((s, p) => s + p.achieved, 0)
  const target = summaries.reduce((s, p) => s + p.target, 0)
  const activeRas = summaries.reduce((s, p) => s + p.activeRas, 0)
  const achievement = target ? Math.round((achieved / target) * 1000) / 10 : 0
  return {
    achievement,
    achieved,
    target,
    activeRas,
    programmeCount: summaries.length,
    regionCount: regionNames.length,
    status: statusFor(achievement),
  }
}

export function fmtNumber(n: number) {
  return n.toLocaleString('en-US')
}

export const statusMeta: Record<Status, { label: string; dot: string; text: string; bg: string; border: string }> = {
  good: {
    label: 'On track',
    dot: 'bg-success',
    text: 'text-success',
    bg: 'bg-success-muted',
    border: 'border-success/30',
  },
  warning: {
    label: 'At risk',
    dot: 'bg-warning',
    text: 'text-warning',
    bg: 'bg-warning-muted',
    border: 'border-warning/30',
  },
  critical: {
    label: 'Critical',
    dot: 'bg-critical',
    text: 'text-critical',
    bg: 'bg-critical-muted',
    border: 'border-critical/30',
  },
}
