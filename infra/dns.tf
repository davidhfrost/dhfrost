# DNS records for the dhfrost.com Pages site.
# Other records on this zone are managed outside this configuration.

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

# Verification token for Google Search Console ownership of dhfrost.com.
# Safe to delete only after the property is fully unverified in Search Console;
# Google re-checks the TXT periodically.
resource "cloudflare_dns_record" "google_site_verification" {
  zone_id = var.zone_id
  name    = var.apex_domain
  type    = "TXT"
  content = "\"google-site-verification=YnUw5EYWyGUiw65qHFSuPtuWRGYRRaNb4J8sy8HzBW8\""
  ttl     = 3600
  proxied = false
}
