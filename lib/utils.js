export function stringifyJSX(key, value) {
  if (value === Symbol.for('react.transitional.element')) {
    return '$RE'
  } else if (typeof value === 'string' && value.startsWith('$')) {
    return '$' + value
  } else {
    return value
  }
}

export function parseJSX(key, value) {
  if (value === '$RE') {
    // This is our special marker we added on the server.
    // Restore the Symbol to tell React that this is valid JSX.
    return Symbol.for('react.transitional.element')
  } else if (typeof value === 'string' && value.startsWith('$$')) {
    // This is a string starting with $. Remove the extra $ added by the server.
    return value.slice(1)
  } else {
    return value
  }
}

export async function fetchClientJSX(pathname) {
  const response = await fetch('http://localhost:3000' + pathname + '?_rsc')
  return JSON.parse(await response.text(), parseJSX)
}
