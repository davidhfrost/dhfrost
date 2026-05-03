variable "account_id" {
  type        = string
  description = "Cloudflare account ID owning the dhfrost Pages project and the dhfrost.com zone."
}

variable "zone_id" {
  type        = string
  description = "Cloudflare zone ID for dhfrost.com."
}

variable "project_name" {
  type        = string
  description = "Cloudflare Pages project name."
  default     = "dhfrost"
}

variable "apex_domain" {
  type        = string
  description = "Canonical apex hostname."
  default     = "dhfrost.com"
}
