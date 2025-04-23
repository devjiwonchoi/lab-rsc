import { createServer } from 'http'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { build } from './build.js'

function getHtml(content) {
  return `
<!doctype html>
<html>
  <head>
    <title>My App</title>
  </head>
  <body>
    ${content}
  </body>
</html>
`
}

async function app(req) {
  if (req.url === '/') {
    const Page = await import('./build/page.js')
    const pageHtml = renderToString(createElement(Page.default))
    const html = getHtml(pageHtml)

    return html
  }
}

const server = createServer(async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(await app(req))
})

const PORT = 3000
server.listen(PORT, async () => {
  await build()
  console.log(`Server running at http://localhost:${PORT}`)
})
