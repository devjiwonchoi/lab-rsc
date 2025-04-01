import { createServer } from 'http'

function getHtml(content) {
  return `
<!doctype html>
<html>
<head>
</head>
<body>
    ${content}
</body>
</html>
`
}

function app(req) {
  if (req.url === '/') {
    const html = getHtml(`
      <p>hello world</p>
    `)

    return html
  }
}

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(app(req))
})

const PORT = 3000
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
