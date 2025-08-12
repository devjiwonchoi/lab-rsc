import { hydrateRoot } from 'react-dom/client'
import { parseJSX, fetchClientJSX } from './utils.js'

const root = hydrateRoot(
  document,
  JSON.parse(window.__INITIAL_CLIENT_JSX_STRING__, parseJSX)
)

async function navigate(pathname) {
  root.render(await fetchClientJSX(pathname))
}

window.addEventListener(
  'click',
  (e) => {
    // Only listen to link clicks.
    if (e.target.tagName !== 'A') {
      return
    }
    // Ignore "open in a new tab".
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return
    }
    // Ignore external URLs.
    const href = e.target.getAttribute('href')
    if (!href.startsWith('/')) {
      return
    }
    // Prevent the browser from reloading the page but update the URL.
    e.preventDefault()
    window.history.pushState(null, null, href)
    // Call our custom logic.
    navigate(href)
  },
  true
)

window.addEventListener('popstate', () => {
  // When the user presses Back/Forward, call our custom logic too.
  navigate(window.location.pathname)
})

// Handle form submissions without page reload
window.addEventListener('submit', async (e) => {
  const form = e.target
  
  // Only handle forms with server action URLs
  if (!form.action.includes('/_sa/')) {
    return
  }
  
  e.preventDefault()
  
  // Submit form data as URL-encoded
  const formData = new FormData(form)
  const urlEncodedData = new URLSearchParams(formData)
  
  await fetch(form.action, {
    method: form.method || 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: urlEncodedData
  })
  
  // Re-render the current page to show updated data
  navigate(window.location.pathname)
  
  // Clear the form
  form.reset()
})

