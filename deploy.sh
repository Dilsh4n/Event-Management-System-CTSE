#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# EC2 Deployment Script
# ─────────────────────────────────────────────────────────────────────────────
# This script runs on the EC2 instance to pull latest images and restart.
# Used by GitHub Actions CI/CD pipeline and for manual deployments.
#
# Usage:
#   ./deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

cd ~/event-mgmt

# Load environment variables
export $(grep -v '^#' .env | xargs)

echo "═══════════════════════════════════════"
echo "  Event Management System — Deploying"
echo "═══════════════════════════════════════"

# Step 1: Authenticate with ECR
echo ""
echo "→ Step 1/4: Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Step 2: Pull latest images
echo ""
echo "→ Step 2/4: Pulling latest images..."
docker compose -f docker-compose.prod.yml pull

# Step 3: Restart services with new images
echo ""
echo "→ Step 3/4: Restarting services..."
docker compose -f docker-compose.prod.yml up -d --force-recreate

# Step 4: Cleanup
echo ""
echo "→ Step 4/4: Cleaning up old images..."
docker image prune -f

# Status
echo ""
echo "═══════════════════════════════════════"
echo "  Deployment Complete!"
echo "═══════════════════════════════════════"
echo ""
docker compose -f docker-compose.prod.yml ps
echo ""
echo "Memory usage:"
free -h
