import got from 'got'

function calcVersion (version) {
  const [major, minor, patch] = version.replace(/^v/, '').split('.').map(Number)
  return major * 1e6 + minor * 1e3 + patch
}

export async function getLatestLtsVersion () {
  // Use GitHub API releases
  const data = await got('https://api.github.com/repos/nodejs/node/releases', {
    headers: {
      'User-Agent': 'cff-dependency-dashboard'
    }
  }).json()

  // Filter only LTS releases (GitHub marks them with "LTS" in the release name)
  const lts = data.filter(r => /LTS/i.test(r.name))

  lts.forEach(item => {
    item.numVersion = calcVersion(item.tag_name)
  })

  lts.sort((a, b) => b.numVersion - a.numVersion)

  return lts[0].tag_name.replace(/^v/, '')
}
