# One-time import blocks. Delete this file once the first `tofu apply` has
# imported existing dashboard state and `tofu plan` shows zero diff.

import {
  to = cloudflare_pages_project.dhfrost
  id = "${var.account_id}/${var.project_name}"
}

import {
  to = cloudflare_pages_domain.apex
  id = "${var.account_id}/${var.project_name}/${var.apex_domain}"
}

import {
  to = cloudflare_pages_domain.www
  id = "${var.account_id}/${var.project_name}/www.${var.apex_domain}"
}

import {
  to = cloudflare_dns_record.apex_pages
  id = "${var.zone_id}/d094aceb69f37437683e9aa1c8f51343"
}

import {
  to = cloudflare_dns_record.www_pages
  id = "${var.zone_id}/909cbea4919ab383c5a19a7a0a844463"
}

import {
  to = cloudflare_dns_record.google_site_verification
  id = "${var.zone_id}/648458cc2fddbb976818fe331c11896e"
}

import {
  to = cloudflare_ruleset.www_to_apex
  id = "${var.zone_id}/5efe0ee63a6f43efb5933ebf3d6de12e"
}
