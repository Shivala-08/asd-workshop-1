const TTL_MS = parseInt(process.env.CACHE_TTL_MS || '', 10) || 60 * 1000 // 1 minute

// cache[key] = { value, createdAt }
const cache = new Map()

function isExpired(entry) {
    return Date.now() - entry.createdAt > TTL_MS
}

// Middleware factory: cacheable(keyFn, [ttl])
function cacheable(keyFn, ttlMs = TTL_MS) {
    return function cacheMiddleware(req, res, next) {
        const key = keyFn(req)

        const entry = cache.get(key)
        if (entry && !isExpired(entry)) {
            res.set('X-Cache', 'HIT')
            return res.json(entry.value)
        }

        // No entry or expired -> treat as MISS
        res.set('X-Cache', 'MISS')

        // Intercept the JSON response so we can store it before it's sent
        const originalJson = res.json.bind(res)
        res.json = (body) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cache.set(key, { value: body, createdAt: Date.now() })
            }
            return originalJson(body)
        }

        next()
    }
}

// Invalidate every entry — called after any successful write (POST/PUT/PATCH/DELETE)
function clearCache() {
    cache.clear()
}

module.exports = { cacheable, clearCache, TTL_MS }
