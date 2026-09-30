#!/usr/bin/env bash
# Verifies: HIT/MISS headers, write invalidation, and TTL expiry.
set -u
PORT=3199
B="http://127.0.0.1:$PORT"
LOG=/tmp/workshop-test-server.log

env PORT=$PORT node server.js > "$LOG" 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null' EXIT

# Wait for the server to accept connections
# (use /products/999: 404 responses are not cached, so this warms up nothing)
for i in $(seq 1 20); do
  if curl -s -o /dev/null "$B/products/999"; then break; fi
  sleep 0.25
done

hit_or_miss() { curl -s -o /dev/null -D - "$1" | grep -i '^X-Cache' | tr -d '\r'; }
status() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

pass=0; fail=0
check() { # check <description> <expected> <actual>
  if [ "$2" = "$3" ]; then
    echo "PASS: $1 ($3)"; pass=$((pass+1))
  else
    echo "FAIL: $1 (expected $2, got $3)"; fail=$((fail+1))
  fi
}

check "GET /products first call is MISS"  "X-Cache: MISS" "$(hit_or_miss $B/products)"
check "GET /products second call is HIT"  "X-Cache: HIT"  "$(hit_or_miss $B/products)"
check "GET /products/1 first call is MISS" "X-Cache: MISS" "$(hit_or_miss $B/products/1)"
check "GET /products/1 second call is HIT" "X-Cache: HIT"  "$(hit_or_miss $B/products/1)"
check "GET /products/999 not found"       "404"           "$(status $B/products/999)"

check "POST /products creates product"    "201"           "$(status -X POST $B/products -H 'Content-Type: application/json' -d '{"name":"SSD","price":89.99}')"
check "GET /products after POST is MISS (invalidated)" "X-Cache: MISS" "$(hit_or_miss $B/products)"
check "GET /products/1 after POST is MISS (invalidated)" "X-Cache: MISS" "$(hit_or_miss $B/products/1)"

check "PATCH /products/1 updates product" "200"           "$(status -X PATCH $B/products/1 -H 'Content-Type: application/json' -d '{"price":59.99}')"
check "GET /products after PATCH is MISS (invalidated)" "X-Cache: MISS" "$(hit_or_miss $B/products)"

check "PUT /products/2 updates product"   "200"           "$(status -X PUT $B/products/2 -H 'Content-Type: application/json' -d '{"name":"Mouse","price":25}')"
check "GET /products/2 after PUT is MISS (invalidated)" "X-Cache: MISS" "$(hit_or_miss $B/products/2)"

check "DELETE /products/999 is 404"       "404"           "$(status -X DELETE $B/products/999)"
NEW_ID=$(curl -s $B/products | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{const p=JSON.parse(d);console.log(p[p.length-1].id)})')
check "DELETE /products/$NEW_ID deletes product" "204"    "$(status -X DELETE $B/products/$NEW_ID)"
check "GET /products/$NEW_ID after DELETE is 404" "404"   "$(status $B/products/$NEW_ID)"

echo "---- TTL expiry test (server ttl=3s, wait 4s) ----"
kill $SERVER_PID 2>/dev/null; wait $SERVER_PID 2>/dev/null
env PORT=$PORT CACHE_TTL_MS=3000 node server.js >> "$LOG" 2>&1 &
SERVER_PID=$!
for i in $(seq 1 20); do
  if curl -s -o /dev/null "$B/products"; then break; fi
  sleep 0.25
done
hit_or_miss $B/products > /dev/null
check "GET /products cached within TTL is HIT" "X-Cache: HIT" "$(hit_or_miss $B/products)"
sleep 4
check "GET /products after TTL expiry is MISS" "X-Cache: MISS" "$(hit_or_miss $B/products)"
check "GET /products re-cached after expiry is HIT" "X-Cache: HIT" "$(hit_or_miss $B/products)"

echo
echo "Results: $pass passed, $fail failed"
exit $fail
