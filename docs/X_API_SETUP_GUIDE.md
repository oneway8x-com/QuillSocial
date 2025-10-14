# X/Twitter API Setup Guide

This guide will walk you through the process of creating and configuring your X/Twitter API credentials for QuillSocial.

## Prerequisites

- An active X/Twitter account
- Access to the [X/Twitter Developer Portal](https://developer.twitter.com/en/portal/projects-and-apps)

## Overview

To use QuillSocial with X/Twitter, you'll need four credentials:
- **API Key** (Consumer Key)
- **API Key Secret** (Consumer Secret)
- **Access Token**
- **Access Token Secret**

---

## Step 1: Access the X/Twitter Developer Portal

1. Go to [https://developer.twitter.com/en/portal/projects-and-apps](https://developer.twitter.com/en/portal/projects-and-apps)
2. Sign in with your X/Twitter account
3. If this is your first time, you may need to apply for a developer account

_[Screenshot placeholder: Developer Portal dashboard]_

---

## Step 2: Create a New Project (If Needed)

1. Click on **"+ Create Project"**
2. Enter your project name
3. Select your use case
4. Provide a project description
5. Click **"Next"** to proceed

_[Screenshot placeholder: Create Project form]_

---

## Step 3: Create a New App

1. Within your project, click on **"+ Add App"**
2. Choose **"Create new App"** or select an existing app
3. Enter your app name (e.g., "QuillSocial")
4. Click **"Complete"**

_[Screenshot placeholder: Create App form]_

---

## Step 4: Generate API Keys (Consumer Keys)

After creating your app, you'll be shown your API credentials:

1. **Save your API Key and API Key Secret immediately**
   - API Key (Consumer Key)
   - API Key Secret (Consumer Secret)
2. Store these in a secure location - you won't be able to see the secret again

> ⚠️ **Important:** Keep these credentials secure and never share them publicly or commit them to version control.

_[Screenshot placeholder: API Keys screen]_

---

## Step 5: Configure App Permissions ⚠️ CRITICAL STEP

Before generating Access Tokens, you **must** set the correct permissions:

1. In your app dashboard, click on **"App Settings"**
2. Navigate to **"User authentication settings"** → Click **"Set up"**
3. Under **"App permissions"**, change from **"Read"** to **"Read and write"**
4. Fill in any required callback URLs (you can use `http://localhost:3000/api/auth/callback/twitter` for development)
5. Fill in your app's website URL
6. Click **"Save"**

> ⚠️ **Critical:** Without "Read and write" permissions, posting tweets will fail with permission errors. Old tokens generated with "Read" permissions will NOT work for posting.

_[Screenshot placeholder: App permissions settings showing "Read and write" selected]_

---

## Step 6: Generate Access Tokens

Now that permissions are set correctly, generate your Access Tokens:

1. Go to the **"Keys and tokens"** tab in your app settings
2. Scroll down to the **"Authentication Tokens"** section
3. Click **"Generate"** under **"Access Token and Secret"**
4. **Save both credentials immediately:**
   - Access Token
   - Access Token Secret
5. Store these securely - you won't be able to see them again

_[Screenshot placeholder: Access Token generation screen]_

---

## Step 7: Verify Your Credentials

You should now have all four credentials:

✅ **API Key** (Consumer Key)  
✅ **API Key Secret** (Consumer Secret)  
✅ **Access Token**  
✅ **Access Token Secret**

_[Screenshot placeholder: Keys and tokens overview showing all four credential types]_

---

## Step 8: Add Credentials to QuillSocial

1. Open QuillSocial and navigate to the X/Twitter integration settings
2. Enter your four credentials in the respective fields:
   - API Key
   - API Key Secret
   - Access Token
   - Access Token Secret
3. Click **"Save"** or **"Connect"**

Your credentials will be **encrypted and stored securely**.

_[Screenshot placeholder: QuillSocial credentials form]_

---

## Troubleshooting

### Error: "Forbidden - You don't have permission to post"

**Solution:** This usually means your Access Tokens were generated before setting "Read and write" permissions.

1. Go back to your app settings
2. Verify "App permissions" are set to "Read and write"
3. **Regenerate new Access Tokens**
4. Update the tokens in QuillSocial

### Error: "Invalid or expired token"

**Solution:** 
1. Verify you've entered all four credentials correctly
2. Make sure there are no extra spaces or characters
3. Try regenerating your tokens

### Can't find "Keys and tokens" tab

**Solution:** 
1. Make sure you're in the correct project
2. Navigate to your app (not just the project)
3. Look for the "Keys and tokens" tab in the app dashboard

---

## Additional Resources

- [X/Twitter API Documentation](https://developer.x.com/en/docs)
- [OAuth 1.0a Authentication Guide](https://developer.x.com/en/docs/authentication/oauth-1-0a/api-key-and-secret)
- [X Developer Portal](https://developer.twitter.com/en/portal/projects-and-apps)

---

## Security Best Practices

- ✅ Never share your API credentials
- ✅ Never commit credentials to version control
- ✅ Use environment variables for storing credentials in development
- ✅ Regenerate tokens if you suspect they've been compromised
- ✅ Regularly review your app's access and permissions

---

## Need Help?

If you encounter issues not covered in this guide, please:
1. Check the [X API Status Page](https://api.twitterstat.us/)
2. Review the [X Developer Community Forums](https://twittercommunity.com/)
3. Contact QuillSocial support

---

*Last updated: October 2025*
