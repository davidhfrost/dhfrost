# Zone-level SSL/TLS settings for dhfrost.com.
#
# These were previously managed in the Cloudflare dashboard and could be
# silently downgraded without leaving an audit trail. Codifying them here
# means changes go through PR review and `tofu plan` will surface any drift.
#
# First apply will assume management of whatever values the dashboard
# currently holds; review the plan output before merging if those values
# differ from what's declared below.

# TEMPORARY: SSL mode is "full" rather than "strict" because the
# retrofolio.dhfrost.com origin currently serves a self-signed cert.
# "strict" rejects self-signed origin certs and 526s the subdomain.
#
# Flip back to "strict" once the retrofolio origin presents a cert
# trusted by Cloudflare (the standard fix is a Cloudflare Origin
# Certificate installed at the origin VM; valid 15 years, no renewal).
#
# Browser-to-Cloudflare leg remains TLS 1.3 + HSTS regardless. Only
# the Cloudflare-to-origin hop is affected by this setting.
resource "cloudflare_zone_setting" "ssl" {
  zone_id    = var.zone_id
  setting_id = "ssl"
  value      = "full"
}

# 301 any plaintext HTTP request to HTTPS at the edge.
resource "cloudflare_zone_setting" "always_use_https" {
  zone_id    = var.zone_id
  setting_id = "always_use_https"
  value      = "on"
}

# Reject TLS handshakes below 1.3. Modern browsers and crawlers all
# support 1.3; the only clients locked out are pre-2018 browsers and
# some embedded devices.
resource "cloudflare_zone_setting" "min_tls_version" {
  zone_id    = var.zone_id
  setting_id = "min_tls_version"
  value      = "1.3"
}
