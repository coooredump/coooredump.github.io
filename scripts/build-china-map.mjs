/**
 * Build the static SVG geometry used by the About page travel map.
 *
 * Source: DataV.GeoAtlas province boundaries
 *   https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json
 *
 * The output is committed, so normal builds never need network access.
 * Re-run with: npm run build:map
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CACHE = path.join(ROOT, 'node_modules', '.cache', 'china-geo.json')
const OUT = path.join(ROOT, 'src', 'data', 'china-map.generated.ts')
const CITY_OUT = path.join(ROOT, 'src', 'data', 'china-cities.generated.ts')
const CITY_CACHE_DIR = path.join(ROOT, 'node_modules', '.cache', 'china-cities')
const BOUND_OUT_DIR = path.join(ROOT, 'public', 'data', 'cities')
const CITY_BOUND_CACHE_DIR = path.join(ROOT, 'node_modules', '.cache', 'china-city-bounds')
const SOURCE = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json'
const CITY_SOURCE = (adcode) => `https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`
const CITY_BOUND_SOURCE = (adcode) => `https://geo.datav.aliyun.com/areas_v3/bound/${adcode}.json`

const VIEW_W = 1000
const VIEW_H = 820
const PAD = 24

// Albers equal-area conic projection, standard parallels for China.
const rad = (deg) => (deg * Math.PI) / 180
const LON0 = rad(105)
const LAT0 = rad(36)
const PHI1 = rad(25)
const PHI2 = rad(47)
const N = (Math.sin(PHI1) + Math.sin(PHI2)) / 2
const C = Math.cos(PHI1) ** 2 + 2 * N * Math.sin(PHI1)
const RHO0 = Math.sqrt(C - 2 * N * Math.sin(LAT0)) / N

function project([lon, lat]) {
  const rho = Math.sqrt(C - 2 * N * Math.sin(rad(lat))) / N
  const theta = N * (rad(lon) - LON0)
  return [rho * Math.sin(theta), RHO0 - rho * Math.cos(theta)]
}

function polygonRings(feature) {
  const { type, coordinates } = feature.geometry
  if (type === 'Polygon') return coordinates.map((ring) => [ring])
  if (type === 'MultiPolygon') return coordinates
  return []
}

function ringBounds(ring) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of ring) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  return { minX, minY, maxX, maxY }
}

function centroid(ring) {
  let area = 0
  let cx = 0
  let cy = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i]
    const [x1, y1] = ring[i + 1]
    const cross = x0 * y1 - x1 * y0
    area += cross
    cx += (x0 + x1) * cross
    cy += (y0 + y1) * cross
  }
  if (Math.abs(area) < 1e-12) {
    const b = ringBounds(ring)
    return [(b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2]
  }
  area *= 0.5
  return [cx / (6 * area), cy / (6 * area)]
}

function ringArea(ring) {
  let area = 0
  for (let i = 0; i < ring.length - 1; i++) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  }
  return Math.abs(area / 2)
}

// Perpendicular distance from p to segment ab, used by Douglas-Peucker.
function distanceToSegment(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)
  const clamped = Math.max(0, Math.min(1, t))
  return Math.hypot(p[0] - (a[0] + clamped * dx), p[1] - (a[1] + clamped * dy))
}

function simplify(points, tolerance) {
  if (points.length <= 3) return points
  const sqTolerance = tolerance * tolerance
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [first, last] = stack.pop()
    let maxDist = sqTolerance
    let index = -1
    for (let i = first + 1; i < last; i++) {
      const dist = distanceToSegment(points[i], points[first], points[last]) ** 2
      if (dist > maxDist) {
        maxDist = dist
        index = i
      }
    }
    if (index !== -1) {
      keep[index] = 1
      stack.push([first, index], [index, last])
    }
  }
  return points.filter((_, i) => keep[i])
}

function toPath(polygons) {
  const parts = []
  for (const ring of polygons) {
    if (ring.length < 3) continue
    parts.push('M' + ring.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z')
  }
  return parts.join('')
}

const SHORT_NAMES = {
  北京市: '北京',
  天津市: '天津',
  上海市: '上海',
  重庆市: '重庆',
  河北省: '河北',
  山西省: '山西',
  内蒙古自治区: '内蒙古',
  辽宁省: '辽宁',
  吉林省: '吉林',
  黑龙江省: '黑龙江',
  江苏省: '江苏',
  浙江省: '浙江',
  安徽省: '安徽',
  福建省: '福建',
  江西省: '江西',
  山东省: '山东',
  河南省: '河南',
  湖北省: '湖北',
  湖南省: '湖南',
  广东省: '广东',
  广西壮族自治区: '广西',
  海南省: '海南',
  四川省: '四川',
  贵州省: '贵州',
  云南省: '云南',
  西藏自治区: '西藏',
  陕西省: '陕西',
  甘肃省: '甘肃',
  青海省: '青海',
  宁夏回族自治区: '宁夏',
  新疆维吾尔自治区: '新疆',
  台湾省: '台湾',
  香港特别行政区: '香港',
  澳门特别行政区: '澳门'
}

// Provinces whose city-level data is one unit (municipalities and SARs).
const SINGLE_CITY_PROVINCES = new Set(['北京', '天津', '上海', '重庆', '香港', '澳门'])

// Used only to shorten autonomous-prefecture names such as
// 大理白族自治州 -> 大理, 红河哈尼族彝族自治州 -> 红河.
const ETHNIC_GROUPS = [
  '蒙古',
  '回',
  '藏',
  '维吾尔',
  '苗',
  '彝',
  '壮',
  '布依',
  '朝鲜',
  '满',
  '侗',
  '瑶',
  '白',
  '土家',
  '哈尼',
  '哈萨克',
  '傣',
  '黎',
  '傈僳',
  '佤',
  '畲',
  '高山',
  '拉祜',
  '水',
  '东乡',
  '纳西',
  '景颇',
  '柯尔克孜',
  '土',
  '达斡尔',
  '仫佬',
  '羌',
  '布朗',
  '撒拉',
  '毛南',
  '仡佬',
  '锡伯',
  '阿昌',
  '普米',
  '塔吉克',
  '怒',
  '乌孜别克',
  '俄罗斯',
  '鄂温克',
  '德昂',
  '保安',
  '裕固',
  '京',
  '塔塔尔',
  '独龙',
  '鄂伦春',
  '赫哲',
  '门巴',
  '珞巴',
  '基诺'
]
const ETHNIC_AUTONOMOUS = new RegExp(`(?:(?:${ETHNIC_GROUPS.join('|')})族)+自治州$`)
const NON_ETHNIC_AUTONOMOUS =
  /(?:蒙古|哈萨克|柯尔克孜|藏|羌|彝|苗|侗|土家|布依|傣|景颇|傈僳|哈尼|白|回|壮|瑶|黎)自治州$/

function normalizeCityName(name) {
  const original = String(name || '').trim()
  let short = original.replace(ETHNIC_AUTONOMOUS, '')
  short = short.replace(NON_ETHNIC_AUTONOMOUS, '')
  short = short.replace(/(自治州|地区|盟|市|特别行政区|自治县)$/, '').trim()
  return short || original
}

// Point locations for the cities that appear in the tourism posts.
// Kept in sync by hand; unknown cities simply render without a dot.
const CITY_COORDS = {
  北京: [116.4074, 39.9042],
  昆明: [102.8329, 24.8801],
  大理: [100.2676, 25.6065],
  丽江: [100.2278, 26.8721],
  成都: [104.0665, 30.5723],
  西安: [108.9398, 34.3416],
  银川: [106.2309, 38.4872],
  武汉: [114.3055, 30.5928],
  杭州: [120.1551, 30.2741],
  福州: [119.2965, 26.0745],
  厦门: [118.0894, 24.4798],
  泉州: [118.6757, 24.8741],
  漳州: [117.6471, 24.513],
  广州: [113.2644, 23.1291],
  深圳: [114.0579, 22.5431],
  潮州: [116.6323, 23.6567],
  赣州: [114.935, 25.831]
}

async function loadGeo() {
  try {
    const text = await fs.readFile(CACHE, 'utf8')
    return JSON.parse(text)
  } catch {
    // Cache miss: fetch once, then keep it in node_modules/.cache.
    const response = await fetch(SOURCE)
    if (!response.ok) throw new Error(`Failed to fetch ${SOURCE}: ${response.status}`)
    const geo = await response.json()
    await fs.mkdir(path.dirname(CACHE), { recursive: true })
    await fs.writeFile(CACHE, JSON.stringify(geo))
    return geo
  }
}

async function loadCityGeo(adcode) {
  const file = path.join(CITY_CACHE_DIR, `${adcode}.json`)
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'))
  } catch {
    const response = await fetch(CITY_SOURCE(adcode))
    if (!response.ok) {
      console.warn(`[cities] skip ${adcode}: HTTP ${response.status}`)
      return null
    }
    const geo = await response.json()
    await fs.mkdir(CITY_CACHE_DIR, { recursive: true })
    await fs.writeFile(file, JSON.stringify(geo))
    return geo
  }
}

async function loadCityBoundary(adcode) {
  const file = path.join(CITY_BOUND_CACHE_DIR, `${adcode}.json`)
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'))
  } catch {
    const response = await fetch(CITY_BOUND_SOURCE(adcode))
    if (!response.ok) {
      console.warn(`[bounds] skip ${adcode}: HTTP ${response.status}`)
      return null
    }
    const geo = await response.json()
    await fs.mkdir(CITY_BOUND_CACHE_DIR, { recursive: true })
    await fs.writeFile(file, JSON.stringify(geo))
    return geo
  }
}

// Run `fn` over `items` with at most `limit` in flight.
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let index = 0
  async function worker() {
    while (index < items.length) {
      const i = index++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

// Project + simplify a DataV feature into a single SVG path string.
function featureToPath(feature, toSvg, tolerance, minArea) {
  const parts = []
  for (const polygons of polygonRings(feature)) {
    for (let i = 0; i < polygons.length; i++) {
      const ring = polygons[i]
      const projected = ring.map(toSvg)
      const simplified = simplify(projected, tolerance)
      if (simplified.length < 3) continue
      if (ringArea(projected) < minArea) continue
      parts.push(
        'M' + simplified.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z'
      )
    }
  }
  return parts.join('')
}

async function main() {
  const geo = await loadGeo()
  const features = geo.features
  const southSeaFeature = features.find((f) => f.properties?.adchar === 'JD')

  const mainRings = []
  const insetRings = []

  for (const feature of features) {
    if (feature === southSeaFeature) continue
    const name = feature.properties?.name || ''
    const short = SHORT_NAMES[name] || name.replace(/(省|市|自治区|特别行政区)$/, '')
    if (!short) continue
    for (const polygons of polygonRings(feature)) {
      for (let i = 0; i < polygons.length; i++) {
        const ring = polygons[i]
        const bounds = ringBounds(ring)
        // The far-southern islands are drawn in the inset instead, otherwise
        // the mainland would shrink to make room for the South China Sea.
        if (bounds.maxY < 17.5) {
          insetRings.push({ short, ring })
        } else {
          mainRings.push({ short, name, ring, ringIndex: i })
        }
      }
    }
  }

  // ---- Main map projection + fit -----------------------------------------
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const { ring } of mainRings) {
    for (const coord of ring) {
      const [x, y] = project(coord)
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  const scale = Math.min((VIEW_W - PAD * 2) / (maxX - minX), (VIEW_H - PAD * 2) / (maxY - minY))
  const offsetX = (VIEW_W - (maxX - minX) * scale) / 2

  const toSvg = ([lon, lat]) => {
    const [x, y] = project([lon, lat])
    return [offsetX + (x - minX) * scale, PAD + (maxY - y) * scale]
  }

  // Group simplified rings by province.
  const byProvince = new Map()
  for (const { short, name, ring } of mainRings) {
    const projected = ring.map(toSvg)
    const simplified = simplify(projected, 0.55)
    if (simplified.length < 3) continue
    if (ringArea(projected) < 0.08) continue
    if (!byProvince.has(short)) {
      byProvince.set(short, { name, short, rings: [] })
    }
    byProvince.get(short).rings.push(simplified)
  }

  const provinces = []
  for (const feature of features) {
    if (feature === southSeaFeature) continue
    const name = feature.properties?.name || ''
    const short = SHORT_NAMES[name] || name.replace(/(省|市|自治区|特别行政区)$/, '')
    const entry = byProvince.get(short)
    if (!entry) continue

    // Label anchor: the dataset centroid usually sits in the middle of the
    // province; fall back to the largest polygon's centroid.
    let label = null
    if (Array.isArray(feature.properties?.centroid)) {
      label = toSvg(feature.properties.centroid)
    } else {
      let biggest = null
      for (const { ring } of mainRings.filter((r) => r.short === short)) {
        const projected = ring.map(toSvg)
        if (!biggest || ringArea(projected) > ringArea(biggest)) biggest = projected
      }
      if (biggest) label = centroid(biggest)
    }
    if (!label) {
      let biggest = null
      for (const ring of entry.rings) {
        if (!biggest || ringArea(ring) > ringArea(biggest)) biggest = ring
      }
      label = centroid(biggest)
    }

    provinces.push({
      name,
      short,
      adcode: Number(feature.properties?.adcode) || 0,
      d: toPath(entry.rings),
      label: [Number(label[0].toFixed(1)), Number(label[1].toFixed(1))]
    })
  }

  // ---- South China Sea inset --------------------------------------------
  // Fit the nine-dash segments and the scattered southern islands into a
  // small inset box in the lower-right corner of the map.
  const insetW = 104
  const insetH = 170
  const insetX = VIEW_W - insetW - 10
  const insetY = VIEW_H - insetH - 10

  const insetPoints = []
  for (const { ring } of insetRings) {
    for (const coord of ring) insetPoints.push(project(coord))
  }
  const dashRings = []
  if (southSeaFeature) {
    for (const polygons of polygonRings(southSeaFeature)) {
      for (const ring of polygons) {
        dashRings.push(ring)
        for (const coord of ring) insetPoints.push(project(coord))
      }
    }
  }

  let insetMinX = Infinity
  let insetMinY = Infinity
  let insetMaxX = -Infinity
  let insetMaxY = -Infinity
  for (const [x, y] of insetPoints) {
    if (x < insetMinX) insetMinX = x
    if (x > insetMaxX) insetMaxX = x
    if (y < insetMinY) insetMinY = y
    if (y > insetMaxY) insetMaxY = y
  }
  const insetScale = Math.min(
    (insetW - 14) / (insetMaxX - insetMinX),
    (insetH - 28) / (insetMaxY - insetMinY)
  )
  const insetOffsetX = insetX + (insetW - (insetMaxX - insetMinX) * insetScale) / 2
  const toInset = ([x, y]) => [
    insetOffsetX + (x - insetMinX) * insetScale,
    insetY + 20 + (insetMaxY - y) * insetScale
  ]

  const dashPath = dashRings
    .map((ring) => {
      const points = ring.map((coord) => toInset(project(coord)))
      return 'M' + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z'
    })
    .join('')

  const islandDots = []
  for (const { ring } of insetRings) {
    const projected = ring.map((coord) => toInset(project(coord)))
    const [x, y] = centroid(projected)
    islandDots.push([Number(x.toFixed(1)), Number(y.toFixed(1))])
  }

  // ---- City dots ----------------------------------------------------------
  const cityPoints = {}
  for (const [city, coord] of Object.entries(CITY_COORDS)) {
    const [x, y] = toSvg(coord)
    cityPoints[city] = [Number(x.toFixed(1)), Number(y.toFixed(1))]
  }

  // ---- All prefecture-level city points ---------------------------------
  // The About map shows every city inside the selected province, not only the
  // visited ones. Centroids/names live in a generated TS module; the heavier
  // polygon boundaries are emitted as per-province JSON files under
  // public/data/cities/{province-adcode}.json and fetched on demand.
  const citiesByProvince = {}
  const provinceAdcodeByShort = new Map()
  let cityCount = 0

  for (const feature of features) {
    if (feature === southSeaFeature) continue
    const provinceName = feature.properties?.name || ''
    const provinceShort =
      SHORT_NAMES[provinceName] || provinceName.replace(/(省|市|自治区|特别行政区)$/, '')
    const adcode = Number(feature.properties?.adcode)
    if (!provinceShort || !Number.isFinite(adcode) || adcode <= 0) continue
    provinceAdcodeByShort.set(provinceShort, adcode)

    if (SINGLE_CITY_PROVINCES.has(provinceShort)) {
      const center = feature.properties?.center ?? feature.properties?.centroid
      if (!Array.isArray(center)) continue
      const [x, y] = toSvg(center)
      citiesByProvince[provinceShort] = [
        {
          name: provinceShort,
          fullName: provinceName,
          province: provinceShort,
          adcode,
          point: [Number(x.toFixed(1)), Number(y.toFixed(1))]
        }
      ]
      cityCount += 1
      continue
    }

    const cityGeo = await loadCityGeo(adcode)
    if (!cityGeo?.features?.length) {
      console.warn(`[cities] no city data for ${provinceName} (${adcode})`)
      continue
    }

    const seen = new Set()
    const list = []
    for (const cityFeature of cityGeo.features) {
      const fullName = cityFeature.properties?.name || ''
      const center = cityFeature.properties?.center ?? cityFeature.properties?.centroid
      if (!fullName || !Array.isArray(center)) continue
      const name = normalizeCityName(fullName)
      if (!name || seen.has(name)) continue
      seen.add(name)
      const [x, y] = toSvg(center)
      list.push({
        name,
        fullName,
        province: provinceShort,
        adcode: Number(cityFeature.properties?.adcode) || 0,
        point: [Number(x.toFixed(1)), Number(y.toFixed(1))]
      })
    }

    if (list.length) {
      list.sort((a, b) => a.adcode - b.adcode)
      citiesByProvince[provinceShort] = list
      cityCount += list.length
    }
  }

  // ---- City boundaries ----------------------------------------------------
  // Prefecture-level polygons become the clickable "city modules" once a
  // province is zoomed in. Write one JSON file per province so the browser can
  // fetch just the province it needs.
  const boundaryCount = { emitted: 0, skipped: 0 }
  await fs.rm(BOUND_OUT_DIR, { recursive: true, force: true })
  await fs.mkdir(BOUND_OUT_DIR, { recursive: true })

  const provinceByShort = new Map(provinces.map((province) => [province.short, province]))

  for (const [provinceShort, cities] of Object.entries(citiesByProvince)) {
    const provinceAdcode = provinceAdcodeByShort.get(provinceShort)
    if (!provinceAdcode) continue
    const provinceEntry = provinceByShort.get(provinceShort)

    const boundaries = await mapLimit(cities, 12, async (city) => {
      // Municipalities and SARs are a single city; reuse the province outline.
      if (SINGLE_CITY_PROVINCES.has(provinceShort)) {
        boundaryCount.emitted += 1
        return { name: city.name, adcode: city.adcode, d: provinceEntry?.d ?? '' }
      }
      const geo = await loadCityBoundary(city.adcode)
      if (!geo?.features?.length) {
        boundaryCount.skipped += 1
        return { name: city.name, adcode: city.adcode, d: '' }
      }
      const d = featureToPath(geo.features[0], toSvg, 0.7, 0.04)
      if (d) boundaryCount.emitted += 1
      else boundaryCount.skipped += 1
      return { name: city.name, adcode: city.adcode, d }
    })

    const payload = {
      province: provinceShort,
      adcode: provinceAdcode,
      cities: boundaries.filter((boundary) => boundary.d)
    }
    await fs.writeFile(path.join(BOUND_OUT_DIR, `${provinceAdcode}.json`), JSON.stringify(payload))
  }

  // ---- Write output -------------------------------------------------------
  const output = `// AUTO-GENERATED by scripts/build-china-map.mjs - do not edit by hand.
// Source: DataV.GeoAtlas, https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json
// Projection: Albers equal-area conic (105E, 36N, 25N/47N), simplified for display.

export const CHINA_MAP_VIEWBOX = '0 0 ${VIEW_W} ${VIEW_H}'

export interface ChinaMapProvince {
  name: string
  short: string
  adcode: number
  /** SVG path data, already projected into the map viewBox. */
  d: string
  /** Label anchor in viewBox coordinates. */
  label: [number, number]
}

export const chinaProvinces: ChinaMapProvince[] = ${JSON.stringify(provinces, null, 2)}

export const southChinaSea = {
  box: { x: ${insetX}, y: ${insetY}, width: ${insetW}, height: ${insetH} },
  label: [${(insetX + insetW / 2).toFixed(1)}, ${(insetY + 13).toFixed(1)}] as [number, number],
  d: ${JSON.stringify(dashPath)},
  islands: ${JSON.stringify(islandDots)} as [number, number][]
}

export const cityPoints: Record<string, [number, number]> = ${JSON.stringify(cityPoints, null, 2)}
`

  await fs.mkdir(path.dirname(OUT), { recursive: true })
  await fs.writeFile(OUT, output)

  const cityOutput = `// AUTO-GENERATED by scripts/build-china-map.mjs - do not edit by hand.
// Source: DataV.GeoAtlas city-level boundaries, projected into the map viewBox.
// Only names/centroids are emitted; the About map does not draw city polygons.

export interface ChinaCityPoint {
  name: string
  fullName: string
  province: string
  adcode: number
  /** City-government location, projected into the 1000x820 map viewBox. */
  point: [number, number]
}

export const chinaCities: Record<string, ChinaCityPoint[]> = ${JSON.stringify(
    citiesByProvince,
    null,
    2
  )}
`
  await fs.writeFile(CITY_OUT, cityOutput)

  const bytes = Buffer.byteLength(output)
  const cityBytes = Buffer.byteLength(cityOutput)
  console.log(
    `Wrote ${path.relative(ROOT, OUT)} (${(bytes / 1024).toFixed(1)} KB, ` +
      `${provinces.length} provinces, ${islandDots.length} inset islands)`
  )
  console.log(
    `Wrote ${path.relative(ROOT, CITY_OUT)} (${(cityBytes / 1024).toFixed(1)} KB, ` +
      `${cityCount} city points across ${Object.keys(citiesByProvince).length} provinces)`
  )
  console.log(
    `Wrote ${Object.keys(citiesByProvince).length} city-boundary files under ` +
      `${path.relative(ROOT, BOUND_OUT_DIR)} (${boundaryCount.emitted} boundaries, ` +
      `${boundaryCount.skipped} skipped)`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
