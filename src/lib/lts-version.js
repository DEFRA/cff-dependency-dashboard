import got from 'got'
const versionRegex = /v(\d+)\.(\d+)\.(\d+)/

export function calcVersion (x) {
  const match = x.match(versionRegex)
  if (!match) {
    throw new Error(`version regex failed to match version string '${x}'`)
  }
  return (+match[1] * 1000000) + (+match[2] * 1000) + (+match[3])
}

export async function getLatestLtsVersion () {
  const data = await got('https://nodejs.org/download/release/index.json').json()
  const lts = data.filter(item => item.lts)

  lts.forEach(item => {
    item.numVersion = calcVersion(item.version)
  })
  lts.sort((a, b) => b.numVersion - a.numVersion)

  return lts[0].version.replace(/^v/, '')
}
