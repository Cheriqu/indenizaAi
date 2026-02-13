# Last Security Audit: 2026-02-06

## Findings
- **OpenClaw:** Fixed directory permissions (`~/.openclaw` to 700). Warn: `gateway.trusted_proxies_missing` (low risk).
- **System:** `ufw` missing. Server exposed.
- **Ports:** 22 (SSH), 80/443 (Web).

## Actions Taken
- Ran `openclaw security audit --fix`.

## Recommendations (Pending Approval)
1. Install and enable `ufw`.
2. Allow SSH (22), HTTP (80), HTTPS (443).
3. Schedule periodic audits.
