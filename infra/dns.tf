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

# Email-spoofing defenses for an apex that does not send or receive mail.
# SPF declares no authorized senders; DMARC instructs receivers to reject
# anything that fails alignment; null MX (RFC 7505) declares the domain
# accepts no mail at all.
resource "cloudflare_dns_record" "apex_spf" {
  zone_id = var.zone_id
  name    = var.apex_domain
  type    = "TXT"
  content = "\"v=spf1 -all\""
  ttl     = 3600
  proxied = false
}

resource "cloudflare_dns_record" "dmarc" {
  zone_id = var.zone_id
  name    = "_dmarc.${var.apex_domain}"
  type    = "TXT"
  content = "\"v=DMARC1; p=reject; adkim=s; aspf=s\""
  ttl     = 3600
  proxied = false
}

resource "cloudflare_dns_record" "null_mx" {
  zone_id  = var.zone_id
  name     = var.apex_domain
  type     = "MX"
  content  = "."
  priority = 0
  ttl      = 3600
  proxied  = false
}
