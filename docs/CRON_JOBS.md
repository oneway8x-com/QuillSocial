# QuillSocial Cron Jobs Documentation

This document describes the scheduled cron jobs for automated social media posting and engagement.

## Overview

QuillSocial uses three main cron jobs to automate social media operations:

1. **Post Publishing** - Publishes scheduled posts across all platforms
2. **Comment Plugs** - Posts scheduled comment replies
3. **X Engagement** - Automated engagement for X/Twitter

## Authentication

All cron endpoints require authentication via the `CRON_API_KEY` environment variable.

**Methods:**
- Header: `Authorization: Bearer YOUR_CRON_API_KEY`
- Query param: `?apiKey=YOUR_CRON_API_KEY`

## 1. Post Publishing Cron

**Endpoint:** `/api/cron/Post.ts`

**Purpose:** Publishes scheduled posts that have reached their scheduled time.

**Method:** `POST`

**Supported Platforms:**
- ✅ LinkedIn (`linkedin-social`)
- ✅ X/Twitter (`xconsumerkeys-social`)
- ✅ Facebook (`facebook-social`)
- ✅ Instagram (`instagram-social`)
- ✅ Threads (`threads-social`)

**Query Logic:**
```sql
SELECT * FROM Post 
WHERE status = 'SCHEDULED'
  AND schedulePostDate <= NOW() (UTC)
  AND credential.appId IS NOT NULL
```

**Request Example:**
```bash
curl -X POST 'https://your-domain.com/api/cron/Post' \
  -H "Authorization: Bearer YOUR_CRON_API_KEY" \
  -H "Content-Type: application/json"
```

**Response Example:**
```json
{
  "total": 5,
  "successful": 4,
  "failed": 1,
  "results": [
    {
      "postId": 123,
      "appId": "linkedin-social",
      "status": "success",
      "result": { ... }
    },
    {
      "postId": 124,
      "appId": "facebook-social",
      "status": "error",
      "error": "API rate limit exceeded"
    }
  ]
}
```

**Features:**
- Individual error handling per post
- Detailed logging for each platform
- UTC timezone handling
- Comprehensive result summary

**Logging:**
- `[Post Cron]` prefix for all logs
- ✅ Success indicator
- ❌ Failure indicator with error details

## 2. Comment Plug Cron

**Endpoint:** `/api/cron/CommentPlug.ts`

**Purpose:** Posts scheduled comment replies to previously published posts.

**Method:** `POST`

**Supported Platforms:**
- ✅ X/Twitter (`xconsumerkeys-social`) - Full support
- ⚠️ LinkedIn (`linkedin-social`) - Not yet implemented
- ⚠️ Facebook (`facebook-social`) - Not yet implemented
- ⚠️ Instagram (`instagram-social`) - Not yet implemented
- ⚠️ Threads (`threads-social`) - Not yet implemented

**Query Logic:**
```sql
SELECT * FROM Plug 
WHERE status = 'NEW'
  AND schedulePostDate <= NOW() (UTC)
  AND post.result IS NOT NULL
```

**Request Example:**
```bash
curl -X POST 'https://your-domain.com/api/cron/CommentPlug' \
  -H "Authorization: Bearer YOUR_CRON_API_KEY" \
  -H "Content-Type: application/json"
```

**Response Example:**
```json
{
  "total": 3,
  "successful": 1,
  "skipped": 1,
  "failed": 1,
  "results": [
    {
      "plugId": 456,
      "appId": "xconsumerkeys-social",
      "tweetId": "1234567890",
      "status": "success",
      "result": { ... }
    },
    {
      "plugId": 457,
      "appId": "linkedin-social",
      "status": "skipped",
      "reason": "Platform not supported yet"
    }
  ]
}
```

**Features:**
- Automatically updates plug status (NEW → POSTED/ERROR)
- Records posted timestamp on success
- Gracefully skips unsupported platforms
- Stores error details in plug.result

**Logging:**
- `[CommentPlug Cron]` prefix
- ⚠️ Warning for unsupported platforms
- ✅/❌ Status indicators

## 3. X Engagement Cron

**Endpoint:** `/api/cron/x-engagement.ts`

**Purpose:** Processes automated engagement jobs for X/Twitter (likes, replies, follows, etc.)

**Methods:** `POST` (process jobs), `GET` (get stats)

**Platform:** X/Twitter only

**Request Examples:**

**Process Jobs:**
```bash
curl -X POST 'https://your-domain.com/api/cron/x-engagement' \
  -H "Authorization: Bearer YOUR_CRON_API_KEY" \
  -H "Content-Type: application/json"
```

**Get Stats:**
```bash
curl -X GET 'https://your-domain.com/api/cron/x-engagement' \
  -H "Authorization: Bearer YOUR_CRON_API_KEY"
```

**Response Example (POST):**
```json
{
  "success": true,
  "result": {
    "processed": 10,
    "successful": 8,
    "failed": 2
  },
  "duration": 2500
}
```

**Features:**
- 5-minute timeout protection
- Detailed performance metrics
- Worker stats endpoint
- Comprehensive error logging

**Logging:**
- `[X-Engagement API]` prefix
- Request/response timing
- Error stack traces
- Worker statistics

## Scheduling with Cloud Scheduler

### Google Cloud Scheduler Setup

**Post Publishing (Every 5 minutes):**
```bash
gcloud scheduler jobs create http post-publisher \
  --schedule="*/5 * * * *" \
  --uri="https://your-domain.com/api/cron/Post" \
  --http-method=POST \
  --headers="Authorization=Bearer YOUR_CRON_API_KEY" \
  --location=YOUR_REGION
```

**Comment Plugs (Every 10 minutes):**
```bash
gcloud scheduler jobs create http comment-plugs \
  --schedule="*/10 * * * *" \
  --uri="https://your-domain.com/api/cron/CommentPlug" \
  --http-method=POST \
  --headers="Authorization=Bearer YOUR_CRON_API_KEY" \
  --location=YOUR_REGION
```

**X Engagement (Every 15 minutes):**
```bash
gcloud scheduler jobs create http x-engagement \
  --schedule="*/15 * * * *" \
  --uri="https://your-domain.com/api/cron/x-engagement" \
  --http-method=POST \
  --headers="Authorization=Bearer YOUR_CRON_API_KEY" \
  --location=YOUR_REGION
```

## Testing Locally

**Start the development server:**
```bash
yarn dev
```

**Test Post cron:**
```bash
curl -X POST 'http://localhost:3000/api/cron/Post?apiKey=YOUR_CRON_API_KEY' \
  -H "Content-Type: application/json"
```

**Test CommentPlug cron:**
```bash
curl -X POST 'http://localhost:3000/api/cron/CommentPlug?apiKey=YOUR_CRON_API_KEY' \
  -H "Content-Type: application/json"
```

**Test X Engagement cron:**
```bash
curl -X POST 'http://localhost:3000/api/cron/x-engagement?apiKey=YOUR_CRON_API_KEY' \
  -H "Content-Type: application/json"
```

## Error Handling

All cron jobs implement robust error handling:

1. **Individual Error Isolation** - One failed post doesn't stop others
2. **Promise.allSettled** - All posts are processed even if some fail
3. **Status Updates** - Database records are updated with success/error status
4. **Detailed Logging** - Each step is logged with context
5. **Graceful Degradation** - Unsupported platforms are skipped with warnings

## Monitoring

**Key Metrics to Monitor:**
- Total posts/plugs processed
- Success rate per platform
- Average processing duration
- Error frequency and types
- Skipped items (unsupported platforms)

**Log Patterns:**
```
[Post Cron] Found 5 posts to publish
[Post Cron] ✅ Successfully posted 123 to linkedin-social
[Post Cron] ❌ Failed to post 124 to facebook-social: API rate limit
[Post Cron] Summary: { total: 5, successful: 4, failed: 1 }
```

## Platform Implementation Status

| Platform | Post Function | Comment Function | In Post Cron | In Comment Cron |
|----------|--------------|------------------|--------------|-----------------|
| LinkedIn | ✅ Implemented | ❌ Not yet | ✅ Active | ⚠️ Planned |
| X/Twitter | ✅ Implemented | ✅ Implemented | ✅ Active | ✅ Active |
| Facebook | ✅ Implemented | ❌ Not yet | ✅ Active | ⚠️ Planned |
| Instagram | ✅ Implemented | ❌ Not yet | ✅ Active | ⚠️ Planned |
| Threads | ✅ Implemented | ❌ Not yet | ✅ Active | ⚠️ Planned |

## Future Enhancements

- [ ] Implement comment/reply APIs for LinkedIn, Facebook, Instagram, Threads
- [ ] Add retry logic with exponential backoff
- [ ] Implement rate limiting per platform
- [ ] Add Slack/email notifications for failures
- [ ] Create admin dashboard for cron job monitoring
- [ ] Add metrics export to monitoring tools
- [ ] Implement dry-run mode for testing
- [ ] Add batch size limits to prevent timeouts

## Troubleshooting

**No posts being published:**
1. Check if `schedulePostDate` is in UTC
2. Verify posts have `status = 'SCHEDULED'`
3. Ensure credentials have valid `appId`
4. Check platform API credentials

**Authentication failures:**
1. Verify `CRON_API_KEY` environment variable
2. Check header format: `Authorization: Bearer KEY`
3. Or use query param: `?apiKey=KEY`

**Platform-specific failures:**
1. Check platform API status
2. Verify OAuth tokens are not expired
3. Review rate limiting policies
4. Check credential permissions

**Timeout issues:**
1. Reduce batch size in query
2. Increase cron frequency (process fewer items each run)
3. Optimize platform API calls
4. Check network connectivity

## Security Considerations

1. **Never commit** `CRON_API_KEY` to version control
2. **Rotate** cron API keys regularly
3. **Use HTTPS** for all production cron calls
4. **Restrict** Cloud Scheduler service account permissions
5. **Monitor** for suspicious API usage patterns
6. **Encrypt** sensitive credentials in database

## Support

For issues or questions about cron jobs:
- Check logs with `[Post Cron]`, `[CommentPlug Cron]`, or `[X-Engagement API]` prefix
- Review error messages in response JSON
- Verify database state (post/plug status)
- Test locally before deploying changes
