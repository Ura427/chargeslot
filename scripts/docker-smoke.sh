#!/usr/bin/env bash
# End-to-end smoke test of the Docker Compose stack, as a stranger would run it:
# start from nothing, use the app through its public ports, restart against existing data.
# Used by CI (docker-smoke job); run locally with: bash scripts/docker-smoke.sh
set -euo pipefail

API=http://localhost:3000
WEB=http://localhost:8080

step() { printf '\n==> %s\n' "$1"; }
fail() { printf 'FAIL: %s\n' "$1" >&2; exit 1; }

# Polls a URL until it answers 200 (the API needs db -> migrate -> api to finish first).
wait_for() {
  for _ in $(seq 1 60); do
    if [ "$(curl -s -o /dev/null -w '%{http_code}' "$1")" = 200 ]; then return 0; fi
    sleep 2
  done
  fail "$1 did not answer 200 within 120s"
}

# POSTs JSON. Sets STATUS (HTTP code) and BODY (response text) for the caller.
post() {
  local url=$1 json=$2 token=${3:-}
  local headers=(-H 'Content-Type: application/json')
  if [ -n "$token" ]; then headers+=(-H "Authorization: Bearer $token"); fi
  STATUS=$(curl -s -o /tmp/smoke-body -w '%{http_code}' -X POST "$url" "${headers[@]}" -d "$json")
  BODY=$(cat /tmp/smoke-body)
}

step 'Fresh start (empty database)'
docker compose down -v --remove-orphans
docker compose up -d --build
wait_for "$API/health"
wait_for "$WEB/"

step 'migrate service exited cleanly'
migrate_status=$(docker compose ps -a migrate --format '{{.State}} {{.ExitCode}}')
[ "$migrate_status" = 'exited 0' ] || fail "migrate is '$migrate_status', expected 'exited 0'"

step 'Seed data is served by the API'
stations=$(curl -sf "$API/stations" | jq length)
[ "$stations" = 3 ] || fail "expected 3 stations, got $stations"

step 'Web app is served, including deep routes (SPA fallback)'
curl -sf "$WEB/" | grep -q '<div id="root">' || fail 'index.html not served at /'
curl -sf "$WEB/some/deep/route" | grep -q '<div id="root">' || fail 'deep route did not fall back to index.html'

step 'API allows the web origin (CORS)'
allowed=$(curl -s -o /dev/null -D - -X OPTIONS "$API/auth/login" \
  -H "Origin: $WEB" -H 'Access-Control-Request-Method: POST' |
  tr -d '\r' | awk -F': ' 'tolower($1)=="access-control-allow-origin"{print $2}')
[ "$allowed" = "$WEB" ] || fail "CORS allows '$allowed', expected '$WEB'"

step 'Register, log in, book a slot'
email="smoke-$(date +%s)@example.com"
credentials="{\"email\":\"$email\",\"password\":\"smoke-password\"}"
post "$API/auth/register" "$credentials"
[ "$STATUS" = 201 ] || fail "register returned $STATUS: $BODY"
post "$API/auth/login" "$credentials"
[ "$STATUS" = 201 ] || fail "login returned $STATUS: $BODY"
token=$(jq -r .accessToken <<<"$BODY")

# Tomorrow at the top of the hour, UTC. The database starts empty, so this slot is free.
slot=$(date -u -d 'tomorrow' +%Y-%m-%dT%H:00:00.000Z)
booking="{\"chargerId\":\"00000000-0000-4000-8000-000000000101\",\"slotStart\":\"$slot\"}"
post "$API/reservations" "$booking" "$token"
[ "$STATUS" = 201 ] || fail "first booking returned $STATUS: $BODY"

step 'Same slot again is rejected by the database index'
post "$API/reservations" "$booking" "$token"
[ "$STATUS" = 409 ] || fail "second booking returned $STATUS, expected 409: $BODY"
[ "$(jq -r .code <<<"$BODY")" = SLOT_TAKEN ] || fail "expected code SLOT_TAKEN, got: $BODY"

step 'Restart against existing data (migrate must be safe to rerun)'
docker compose down
docker compose up -d
wait_for "$API/health"
stations=$(curl -sf "$API/stations" | jq length)
[ "$stations" = 3 ] || fail "after restart: expected 3 stations, got $stations"

printf '\nAll smoke checks passed.\n'
