# Deploying QuillSocial to Google Cloud Run

This file documents a simple workflow to build locally (Docker) and deploy to Cloud Run.

## Prerequisites

1. Install Google Cloud CLI and authenticate: `gcloud auth login`
2. Set your project: `gcloud config set project [PROJECT_ID]`
3. Enable Container Registry and Cloud Run APIs:

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## Local Docker Build and Run (Optimized)

The project now uses an optimized build process that builds locally and copies artifacts to a minimal Docker runtime image for maximum speed and reliability.

```bash
# Build optimized Docker image (local build + Docker copy)
chmod +x ./scripts/docker-build-optimized.sh
./scripts/docker-build-optimized.sh quillsocial-local

# Run the container
docker run --rm -p 3000:3000 -e NODE_ENV=production quillsocial-local

# Visit http://localhost:3000
```

### Benefits of the Optimized Build

- **Fast builds**: ~2 minutes vs several minutes
- **Reliable**: No Docker environment compilation issues  
- **Small images**: ~80MB final image size
- **Quick startup**: ~400ms container startup time

## Deploy to Cloud Run (Build Locally, Push to GCR, Deploy)

```bash
# From repo root
chmod +x ./scripts/deploy-cloudrun.sh
./scripts/deploy-cloudrun.sh [PROJECT-ID] quillsocial europe-west4 
# Example
./scripts/deploy-cloudrun.sh my-gcp-project quillsocial-backend us-central1
```

## Notes

- The `Dockerfile` expects `.env.production` at repo root during the build stage. Ensure your production env file contains required variables (DO NOT commit secrets in git).
- The `deploy-cloudrun.sh` script tags the image with a timestamp to avoid collisions.
- After deployment the script will set `CLOUD_RUN_URL` env var on the service with the deployed URL.

## Advanced

- To use Google Cloud Build instead (no local Docker required):

```bash
# from repo root
gcloud builds submit --tag gcr.io/[PROJECT-ID]/quillsocial-backend
```

## Google OAuth setup

This project supports Google Sign-In via NextAuth. To enable it set the environment variable `GOOGLE_API_CREDENTIALS` to the JSON object returned by Google when creating OAuth credentials (the `web` key is used). Example (single-line):

```json
{"web":{"client_id":"YOUR_GOOGLE_CLIENT_ID","client_secret":"YOUR_GOOGLE_CLIENT_SECRET","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","redirect_uris":["https://yourdomain.com/api/auth/callback/google"]}}
```

Also ensure `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set. After setting these variables and deploying the app the Google Sign-In button on the login and signup pages will trigger the OAuth flow.


- For custom domains, use `gcloud run domain-mappings create ...` (see Google Cloud docs).
