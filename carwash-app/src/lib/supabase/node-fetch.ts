import https from 'node:https'
import { setDefaultResultOrder } from 'node:dns'

try {
  setDefaultResultOrder('ipv4first')
} catch {
  // ignore
}

const REQUEST_TIMEOUT_MS = 6000

function headersToObject(headers?: HeadersInit): Record<string, string> {
  const out: Record<string, string> = {}
  if (!headers) return out
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      out[key] = value
    })
    return out
  }
  if (Array.isArray(headers)) {
    for (const [key, value] of headers) out[key] = value
    return out
  }
  return { ...(headers as Record<string, string>) }
}

function bodyToBuffer(body?: BodyInit | null): Buffer | undefined {
  if (body == null) return undefined
  if (typeof body === 'string') return Buffer.from(body)
  if (body instanceof Uint8Array) return Buffer.from(body)
  if (body instanceof ArrayBuffer) return Buffer.from(body)
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(body)) return body
  return undefined
}

/**
 * Server-only fetch that forces IPv4.
 * Native Node fetch on Windows often fails with `TypeError: fetch failed`
 * when *.supabase.co resolves to IPv6 first.
 */
export function nodeIpv4Fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlString =
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const url = new URL(urlString)
  const method = (init?.method || 'GET').toUpperCase()
  const headers = headersToObject(init?.headers)
  const body = bodyToBuffer(init?.body ?? null)

  if (body && !headers['content-length'] && !headers['Content-Length']) {
    headers['Content-Length'] = String(body.length)
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: 'https:',
        hostname: url.hostname,
        port: url.port ? Number(url.port) : 443,
        path: `${url.pathname}${url.search}`,
        method,
        headers,
        family: 4,
        timeout: REQUEST_TIMEOUT_MS,
      },
      res => {
        const chunks: Buffer[] = []
        res.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
        res.on('end', () => {
          const responseHeaders = new Headers()
          for (const [key, value] of Object.entries(res.headers)) {
            if (value === undefined) continue
            responseHeaders.set(key, Array.isArray(value) ? value.join(', ') : value)
          }
          resolve(
            new Response(Buffer.concat(chunks), {
              status: res.statusCode || 500,
              statusText: res.statusMessage || '',
              headers: responseHeaders,
            })
          )
        })
      }
    )

    req.on('error', err => {
      reject(new Error(`Supabase connection failed (${url.hostname}): ${err.message}`))
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error(`Supabase request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`))
    })

    if (init?.signal) {
      if (init.signal.aborted) {
        req.destroy()
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }
      init.signal.addEventListener(
        'abort',
        () => {
          req.destroy()
        },
        { once: true }
      )
    }

    if (body) req.write(body)
    req.end()
  })
}
