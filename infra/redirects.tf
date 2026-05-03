# Zone-level Single Redirect: 301 https://www.dhfrost.com/* → https://dhfrost.com/*
# Authored from the "Redirect from WWW to root [Template]" rule in the dashboard.
# The wildcard match captures hostname-suffix, path, and query in ${1}, so the
# Cloudflare "Preserve query string" toggle is off — the wildcard handles it.

resource "cloudflare_ruleset" "www_to_apex" {
  zone_id     = var.zone_id
  name        = "default"
  description = ""
  kind        = "zone"
  phase       = "http_request_dynamic_redirect"

  rules = [{
    description = "Redirect from WWW to root [Template]"
    enabled     = true
    expression  = "(http.request.full_uri wildcard r\"https://www.*\")"
    action      = "redirect"
    action_parameters = {
      from_value = {
        status_code = 301
        target_url = {
          expression = "wildcard_replace(http.request.full_uri, r\"https://www.*\", r\"https://$${1}\")"
        }
        preserve_query_string = false
      }
    }
  }]
}
