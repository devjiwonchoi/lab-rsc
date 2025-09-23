import { readFile } from 'fs/promises'

function throwNotFound(cause) {
  const notFound = new Error('Not found.', { cause })
  notFound.statusCode = 404
  throw notFound
}

export default async function BlogPostPage({ postSlug }) {
  let content
  let comments = []
  try {
    content = await readFile('./app/posts/' + postSlug + '.txt', 'utf8')
    comments = JSON.parse(await readFile('./app/comments.json', 'utf8'))
  } catch (err) {
    // TODO: render 404 page
    // throwNotFound(err)
  }
  return (
    <section>
      <h2>
        <a href={'/' + postSlug}>{postSlug}</a>
      </h2>
      <article>{content}</article>
      <section>
        <h3>Comments</h3>
        <form method="POST" action="/_sa/comments">
          <textarea name="comment" placeholder="Write a comment..." required />
          <button>Submit</button>
        </form>

        <ul>
          {comments.map((comment, index) => (
            <li key={index}>{comment}</li>
          ))}
        </ul>
      </section>
    </section>
  )
}
