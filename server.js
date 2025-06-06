import { createServer } from 'http'
import { readFile, readdir } from 'fs/promises'
import escapeHtml from 'escape-html'
import sanitizeFilename from 'sanitize-filename'

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    if (url.pathname === '/client.js') {
      await sendScript(res, './client.js')
    } else if (url.searchParams.has('jsx')) {
      url.searchParams.delete('jsx') // Keep the url passed to the <Router> clean
      await sendJSX(res, <Router url={url} />)
    } else {
      await sendHTML(res, <Router url={url} />)
    }
  } catch (err) {
    console.error(err)
    res.statusCode = err.statusCode ?? 500
    res.end()
  }
}).listen(3000)

function Router({ url }) {
  let page
  if (url.pathname === '/') {
    page = <BlogIndexPage />
  } else {
    const postSlug = sanitizeFilename(url.pathname.slice(1))
    page = <BlogPostPage postSlug={postSlug} />
  }
  return <BlogLayout>{page}</BlogLayout>
}

async function BlogIndexPage() {
  const postFiles = await readdir('./posts')
  const postSlugs = postFiles.map((file) =>
    file.slice(0, file.lastIndexOf('.'))
  )
  return (
    <section>
      <h1>Welcome to my blog</h1>
      <div>
        {postSlugs.map((slug) => (
          <Post key={slug} slug={slug} />
        ))}
      </div>
    </section>
  )
}

function BlogPostPage({ postSlug }) {
  return <Post slug={postSlug} />
}

async function Post({ slug }) {
  let content
  try {
    content = await readFile('./posts/' + slug + '.txt', 'utf8')
  } catch (err) {
    throwNotFound(err)
  }
  return (
    <section>
      <h2>
        <a href={'/' + slug}>{slug}</a>
      </h2>
      <article>{content}</article>
    </section>
  )
}

function BlogLayout({ children }) {
  const author = 'Jiwon Choi'
  return (
    <html>
      <head>
        <title>My blog</title>
      </head>
      <body>
        <nav>
          <a href="/">Home</a>
          <hr />
          <input />
          <hr />
        </nav>
        <main>{children}</main>
        <Footer author={author} />
      </body>
    </html>
  )
}

function Footer({ author }) {
  return (
    <footer>
      <hr />
      <p>
        <i>
          (c) {author} {new Date().getFullYear()}
        </i>
      </p>
    </footer>
  )
}

async function sendHTML(res, jsx) {
  let html = await renderJSXToHTML(jsx)
  const clientJSX = await renderJSXToClientJSX(jsx)
  const clientJSXString = JSON.stringify(clientJSX, stringifyJSX)
  console.log({ clientJSXString })
  html += `<script>window.__INITIAL_CLIENT_JSX_STRING__ = `
  html += JSON.stringify(clientJSXString).replace(/</g, '\\u003c')
  html += `</script>`
  html += `
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@19.1.0",
          "react-dom/client": "https://esm.sh/react-dom@19.1.0/client"
        }
      }
    </script>
    <script type="module" src="/client.js"></script>
  `
  res.setHeader('Content-Type', 'text/html')
  res.end(html)
}

function stringifyJSX(key, value) {
  if (value === Symbol.for('react.transitional.element')) {
    return '$RE'
  } else if (typeof value === 'string' && value.startsWith('$')) {
    return '$' + value
  } else {
    return value
  }
}

async function sendJSX(res, jsx) {
  const clientJSX = await renderJSXToClientJSX(jsx)
  const clientJSXString = JSON.stringify(clientJSX, stringifyJSX)
  res.setHeader('Content-Type', 'application/json')
  res.end(clientJSXString)
}

async function sendScript(res, filename) {
  const content = await readFile(filename, 'utf8')
  res.setHeader('Content-Type', 'text/javascript')
  res.end(content)
}

function throwNotFound(cause) {
  const notFound = new Error('Not found.', { cause })
  notFound.statusCode = 404
  throw notFound
}

async function renderJSXToHTML(jsx) {
  if (typeof jsx === 'string' || typeof jsx === 'number') {
    return escapeHtml(jsx)
  } else if (jsx == null || typeof jsx === 'boolean') {
    return ''
  } else if (Array.isArray(jsx)) {
    const childHtmls = await Promise.all(
      jsx.map((child) => renderJSXToHTML(child))
    )
    let html = ''
    let wasTextNode = false
    let isTextNode = false
    for (let i = 0; i < jsx.length; i++) {
      isTextNode = typeof jsx[i] === 'string' || typeof jsx[i] === 'number'
      if (wasTextNode && isTextNode) {
        html += '<!-- -->'
      }
      html += childHtmls[i]
      wasTextNode = isTextNode
    }
    return html
  } else if (typeof jsx === 'object') {
    if (jsx.$$typeof === Symbol.for('react.transitional.element')) {
      if (typeof jsx.type === 'string') {
        let html = '<' + jsx.type
        for (const propName in jsx.props) {
          if (jsx.props.hasOwnProperty(propName) && propName !== 'children') {
            html += ' '
            html += propName
            html += '='
            html += escapeHtml(jsx.props[propName])
          }
        }
        html += '>'
        html += await renderJSXToHTML(jsx.props.children)
        html += '</' + jsx.type + '>'
        return html
      } else if (typeof jsx.type === 'function') {
        const Component = jsx.type
        const props = jsx.props
        const returnedJsx = await Component(props)
        return renderJSXToHTML(returnedJsx)
      } else throw new Error('Not implemented.')
    } else throw new Error('Cannot render an object.')
  } else throw new Error('Not implemented.')
}

async function renderJSXToClientJSX(jsx) {
  if (
    typeof jsx === 'string' ||
    typeof jsx === 'number' ||
    typeof jsx === 'boolean' ||
    jsx == null
  ) {
    // Don't need to do anything special with these types.
    return jsx
  } else if (Array.isArray(jsx)) {
    // Process each item in an array.
    return Promise.all(jsx.map((child) => renderJSXToClientJSX(child)))
  } else if (jsx != null && typeof jsx === 'object') {
    if (jsx.$$typeof === Symbol.for('react.transitional.element')) {
      if (typeof jsx.type === 'string') {
        // This is a component like <div />.
        // Go over its props to make sure they can be turned into JSON.
        return {
          ...jsx,
          props: await renderJSXToClientJSX(jsx.props),
        }
      } else if (typeof jsx.type === 'function') {
        // This is a custom React component (like <Footer />).
        // Call its function, and repeat the procedure for the JSX it returns.
        const Component = jsx.type
        const props = jsx.props
        const returnedJsx = await Component(props)
        return renderJSXToClientJSX(returnedJsx)
      } else throw new Error('Not implemented.')
    } else {
      // This is an arbitrary object (for example, props, or something inside of them).
      // Go over every value inside, and process it too in case there's some JSX in it.
      return Object.fromEntries(
        await Promise.all(
          Object.entries(jsx).map(async ([propName, value]) => [
            propName,
            await renderJSXToClientJSX(value),
          ])
        )
      )
    }
  } else throw new Error('Not implemented')
}