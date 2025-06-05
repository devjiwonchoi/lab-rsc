import { createServer } from 'http'
import { readFile } from 'fs/promises'
import escapeHtml from 'escape-html'

createServer(async (req, res) => {
  const author = 'Jiwon Choi'
  const postContent = await readFile('./posts/hello-world.txt', 'utf8')
  sendHTML(res, <BlogPostPage author={author} postContent={postContent} />)
}).listen(3000)

function BlogPostPage({ postContent, author }) {
  return (
    <html>
      <head>
        <title>My blog</title>
      </head>
      <body>
        <nav>
          <a href="/">Home</a>
          <hr />
        </nav>
        <article>{postContent}</article>
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

function sendHTML(res, jsx) {
  const html = renderJSXToHTML(jsx)
  res.setHeader('Content-Type', 'text/html')
  res.end(html)
}

function renderJSXToHTML(jsx) {
  if (typeof jsx === 'string' || typeof jsx === 'number') {
    return escapeHtml(jsx)
  } else if (jsx == null || typeof jsx === 'boolean') {
    return ''
  } else if (Array.isArray(jsx)) {
    return jsx.map((child) => renderJSXToHTML(child)).join('')
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
        html += renderJSXToHTML(jsx.props.children)
        html += '</' + jsx.type + '>'
        return html
      } else if (typeof jsx.type === 'function') {
        const Component = jsx.type
        const props = jsx.props
        const returnedJsx = Component(props)
        return renderJSXToHTML(returnedJsx)
      } else throw new Error('Not implemented.')
    } else throw new Error('Cannot render an object.')
  } else throw new Error('Not implemented.')
}
