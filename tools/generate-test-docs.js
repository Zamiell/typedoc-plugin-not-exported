'use strict'

const fs = require('fs')
const path = require('path')
const td = require('typedoc')

const FIXTURES_DIR = path.join(__dirname, '..', 'test', 'fixtures')

async function generateFixture(name) {
  const fixtureDir = path.join(FIXTURES_DIR, name)
  const optionsFile = path.join(fixtureDir, 'typedoc.json')
  if (!fs.existsSync(optionsFile)) {
    return
  }

  const app = await td.Application.bootstrapWithPlugins({
    options: optionsFile,
  })

  const project = await app.convert()
  if (!project) {
    throw new Error(`[${name}] TypeDoc conversion failed.`)
  }
  if (app.logger.hasErrors()) {
    throw new Error(`[${name}] TypeDoc reported errors during conversion.`)
  }
  if (app.logger.hasWarnings()) {
    throw new Error(`[${name}] TypeDoc reported warnings during conversion.`)
  }

  await app.generateJson(project, path.join(fixtureDir, 'output.json'))
  console.log(`[${name}] generated output.json`)
}

async function main() {
  const fixtureNames = fs
    .readdirSync(FIXTURES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  for (const name of fixtureNames) {
    await generateFixture(name)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
