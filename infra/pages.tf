resource "cloudflare_pages_project" "dhfrost" {
  account_id        = var.account_id
  name              = var.project_name
  production_branch = "main"

  source = {
    type = "github"
    config = {
      owner                          = "davidhfrost"
      repo_name                      = "frosty"
      production_branch              = "main"
      production_deployments_enabled = true
      preview_deployment_setting     = "all"
      preview_branch_includes        = ["*"]
      path_includes                  = ["*"]
    }
  }

  build_config = {
    build_command   = "pnpm build"
    destination_dir = "dist"
    root_dir        = ""
  }

  deployment_configs = {
    preview = {
      env_vars = {
        NODE_VERSION = {
          type  = "plain_text"
          value = "22"
        }
      }
      fail_open                            = true
      always_use_latest_compatibility_date = false
      compatibility_date                   = "2026-04-12"
      build_image_major_version            = 3
    }
    production = {
      env_vars = {
        NODE_VERSION = {
          type  = "plain_text"
          value = "22"
        }
      }
      fail_open                            = true
      always_use_latest_compatibility_date = false
      compatibility_date                   = "2026-04-12"
      build_image_major_version            = 3
    }
  }
}

resource "cloudflare_pages_domain" "apex" {
  account_id   = var.account_id
  project_name = var.project_name
  name         = var.apex_domain
}

resource "cloudflare_pages_domain" "www" {
  account_id   = var.account_id
  project_name = var.project_name
  name         = "www.${var.apex_domain}"
}
