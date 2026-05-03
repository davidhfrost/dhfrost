# Only DNS records related to the dhfrost Pages site are managed here.
# retrofolio.dhfrost.com and cdn.baseline.dhfrost.com belong to other Pages
# projects and remain dashboard-managed (see ADR 0006).

resource "cloudflare_dns_record" "apex_pages" {
  zone_id = var.zone_id
  name    = var.apex_domain
  type    = "CNAME"
  content = "dhfrost.pages.dev"
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "www_pages" {
  zone_id = var.zone_id
  name    = "www.${var.apex_domain}"
  type    = "CNAME"
  content = "dhfrost.pages.dev"
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "google_site_verification" {
  zone_id = var.zone_id
  name    = var.apex_domain
  type    = "TXT"
  content = "\"google-site-verification=YnUw5EYWyGUiw65qHFSuPtuWRGYRRaNb4J8sy8HzBW8\""
  ttl     = 3600
  proxied = false
}
