# QuillSocial Screen Guide

This guide describes the product screens available from the main app menu so reviewers, stakeholders, and new team members can understand the app without clicking through every page.

The main menu is defined in `packages/features/shell/Shell.tsx`. Routes are shown so engineers can map each description back to the implementation.

QuillSocial now follows one workflow:

Plan -> Create -> Schedule -> Engage -> Track

## Main Menu Screens

Normal users see this cleaned navigation:

- Dashboard
- Ideas
- Create
- Calendar
- Engage
- Library
- Settings

Admin users may additionally see Users.

On mobile, the bottom navigation shows Dashboard, Ideas, Create, Calendar, and More. More contains Engage, Library, Settings, and admin-only Users where applicable.

### Dashboard

Route: `/dashboard`

Dashboard is the starting point for daily content momentum. It gives users one place to decide what to do next: create from today's progress, capture an idea, open the engagement workflow, or review the calendar.

The MVP dashboard includes today's suggested action, continue-draft and start-from-idea shortcuts, an engagement queue shortcut, and placeholders for posting streak, drafts waiting, scheduled posts this week, and engagement queue.

Primary actions:

- Create a post from recent progress.
- Capture a raw idea.
- Open Engage.
- Review Calendar.
- Continue a draft.

### Ideas

Route: `/ideas-pillars`

Ideas is the planning area for collecting raw content ideas and grouping them by content pillar. Users can add a short idea, edit or delete existing ideas, filter by pillar, and open an outline drawer to expand an idea into a more structured post outline.

The screen is designed as the start of the content workflow. Once an idea has enough structure, users can promote it into Repurpose, where it becomes the source material for platform-specific content.

Primary actions:

- Add a new idea.
- Manage content pillars.
- Generate or save an outline for an idea.
- Promote an idea to Repurpose.

### Create

Route: `/create`

Create is the main content creation workspace. It groups the existing creation features into one clear entry point so users do not need to choose between separate top-level Write, AI-Write, Templates, and Post Factory menu items.

Create currently works as a landing page with cards that route to the existing feature screens:

- Write -> `/write/0`
- AI Assist -> `/ai-write`
- Templates -> `/post-generator`
- Repurpose -> `/post-factory`

It also includes LinkedIn Profile Tools:

- LinkedIn Headline Generator -> `/tools/linkedin/headline-generator`
- LinkedIn About Generator -> `/tools/linkedin/about-generator`

Primary actions:

- Open the manual post editor.
- Generate draft posts with AI Assist.
- Browse reusable post templates.
- Repurpose one outline into platform-specific formats.
- Open LinkedIn profile tools.

### Calendar

Route: `/calendar`

Calendar shows scheduled and published content in a calendar view. It uses monthly and time-grid style calendar layouts and loads posts for the current social profile.

Events are color/status coded. Clicking an event opens a detail dialog with the post title/content, schedule time, social platform, image, and current status such as Draft, Pending, Published/Sent, or With errors.

Primary actions:

- View scheduled and historical posts by date.
- Inspect post details from a calendar event.
- Understand scheduling status at a glance.

### Engage

Route: `/engage`

Engage is the unified engagement workspace. It groups X/Twitter and Threads engagement workflows under one human-approved flow:

- Discover relevant conversations.
- Review suggested replies.
- Approve before posting.

Engage currently works as a landing page with cards that route to the existing feature screens:

- X / Twitter -> `/x-connect`
- Threads -> `/threads-connect`

Quill does not send engagement automatically without user approval.

Primary actions:

- Open X / Twitter engagement.
- Open Threads engagement.
- Discover relevant conversations.
- Review and approve suggested replies.

### Library

Route: `/my-content/all`

Alias: `/library` redirects to `/my-content/all`.

Library is the post library. It shows cards for posts tied to the current social profile and organizes them into tabs:

- Draft Posts: saved drafts that have not been published.
- Posted: successfully published posts.
- Scheduled: posts queued for future publishing.
- Error: posts that failed and need attention.

Cards show the connected social identity, post content, optional image, created date, and engagement-style counters. Draft and scheduled posts can be deleted. Error posts can be opened back in Write for correction.

Primary actions:

- Review all saved content.
- Filter by post status.
- Delete draft or scheduled posts.
- Open failed posts for editing.

### Settings

Route: `/settings/my-account/profile`

Settings groups account and workspace configuration. It is the main-menu home for profile details, app integrations, billing, AI usage, and API key/BYOK setup placeholders.

Settings tabs and links include:

- Profile -> `/settings/my-account/profile`
- App Integrations -> `/settings/my-account/app-integrations`
- Billing -> `/billing/overview`
- AI Usage -> `/billing/usage`

The App Integrations screen also includes an API Keys & BYOK placeholder card for future own-key setup.

Primary actions:

- Update personal profile details.
- Connect or manage app integrations.
- Review billing.
- Review AI usage.
- Review the API Keys & BYOK placeholder.

### Users

Route: `/users`

Users is an admin-only user management screen. Normal users do not see it in navigation and are redirected away from it.

Admins can search users by name, email, or username; filter by role; sort by user, email, role, and created date; and page through the user table. Each row shows the user's avatar/name, email verification state, role, organization, created date, onboarding status, and 2FA status.

Primary actions:

- Search users.
- Filter by all users, admins, or regular users.
- Sort the user table.
- Review user status and account metadata.

## Grouped Feature Screens

These screens still exist and remain backward-compatible, but they are no longer separate top-level main-menu items.

### Write

Route: `/write/0` for a new post, `/write/:id` for editing an existing post.

Write is the core composer for drafting, editing, scheduling, and publishing social posts. It includes a large text editor, a toolbar for AI rewrite actions, emoji insertion, draft picking, post formatting, image/video/file attachment, and account switching.

The right side of the screen shows a post preview. The bottom actions let users save a draft, delete the current post, schedule it, or publish immediately. For X/Twitter-style accounts, the screen can also show community selection and character-limit handling.

Primary actions:

- Compose a post manually.
- Rewrite or transform content with AI.
- Add emoji, image, video, or file attachments.
- Save as draft.
- Schedule a post.
- Publish now.
- Switch the active social account.

### AI Assist

Route: `/ai-write`

AI Assist lists AI-generated or AI-assisted post drafts for the current social profile. It checks whether the connected social account is valid and shows a setup banner if the user needs to reconnect an account.

This screen is useful when users want AI help producing post ideas and then selecting one to review or continue editing.

Primary actions:

- View generated post drafts.
- Open a draft for more detail.
- Continue, copy, or use AI-generated content.
- Reconnect a social account if token validation fails.

Note: AI features require the ChatGPT app/integration to be installed.

### Templates

Route: `/post-generator`

Templates is an AI post generator built around reusable content formats. Users can search templates, filter by category, and open a template to fill in guided inputs. The generator then produces post copy based on the selected format.

Template categories include product launch, educational, story/narrative, engagement, and general-purpose formats. Examples include Feature Launch, Sneak Peek, Problem/Solution, How It Works, Before/After, Founder Voice, Valuable Tips, and Start from Scratch.

Primary actions:

- Search for a content template.
- Filter templates by category.
- Select a template.
- Fill in template-specific inputs.
- Generate AI-written post content.

Note: AI generation requires the ChatGPT app/integration to be installed.

### Repurpose

Route: `/post-factory`

Repurpose converts one outline into multiple platform-specific outputs. Users provide an outline, choose a tone, select platforms, optionally add a CTA and UTM parameters, then generate content for LinkedIn, X threads, Instagram carousel, YouTube Shorts, and blog formats.

The output panel uses tabs for each platform. Users can edit generated content, regenerate it, copy it, save platform outputs, generate carousel images/PDFs, and schedule supported outputs.

Primary actions:

- Paste or edit a source outline.
- Choose tone: friendly, authoritative, or contrarian.
- Select target platforms.
- Generate all selected formats.
- Edit, copy, regenerate, save, or schedule outputs.

### X / Twitter Engagement

Route: `/x-connect`

X / Twitter Engagement discovers posts around configured topics or hashtags, lets users review discovered posts, and helps queue AI-assisted replies or engagement jobs for approval.

If no X account is connected, the screen explains the prerequisite and sends users to App Integrations. With a connected account, users can start a scan, configure settings, filter discovered posts by status, select posts in bulk, skip posts, and queue engagement actions.

Primary actions:

- Connect an X account if missing.
- Start or rerun post discovery scans.
- Configure hashtags, topics, limits, and filters.
- Select discovered posts.
- Queue replies or engagement actions for approval.

### Threads Engagement

Route: `/threads-connect`

Threads Engagement mirrors the X / Twitter workflow for Threads. It uses the same engagement components but targets Threads-specific credentials and labels.

Users can connect a Threads account, scan for relevant posts, review results, configure engagement settings, select posts, and queue AI-assisted replies for approval.

Primary actions:

- Connect a Threads account if missing.
- Discover relevant Threads posts.
- Configure engagement settings.
- Select posts for engagement.
- Queue AI-assisted replies for approval.

### LinkedIn Headline Generator

Route: `/tools/linkedin/headline-generator`

LinkedIn Headline Generator creates LinkedIn headline options from a user's CV text. The screen provides one large text area for pasting CV content and generates multiple headline suggestions.

Generated headlines appear as cards with copy buttons, making it easy to reuse the strongest option in LinkedIn or another profile.

Primary actions:

- Paste CV/resume content.
- Generate headline options.
- Copy a generated headline.

Note: AI generation requires the ChatGPT app/integration to be installed.

### LinkedIn About Generator

Route: `/tools/linkedin/about-generator`

LinkedIn About Generator creates LinkedIn About-section copy from a user's CV text. The flow is similar to Headline Generator, but the output is longer profile summary content.

Generated About sections appear as cards with copy buttons.

Primary actions:

- Paste CV/resume content.
- Generate About-section options.
- Copy a generated About section.

Note: AI generation requires the ChatGPT app/integration to be installed.

### App Integrations

Route: `/settings/my-account/app-integrations`

App Integrations is the integration marketplace/connection screen. Users can view available app cards and install, connect, disconnect, or manage integrations. This includes social networks, AI providers, storage, and other platform integrations depending on the app configuration.

This screen is central because many workflows depend on connected services:

- Social accounts are needed for Write, Calendar, Library, X / Twitter Engagement, and Threads Engagement.
- ChatGPT/AI integration is needed for AI Assist, Templates, LinkedIn Headline Generator, LinkedIn About Generator, and AI rewrite actions.
- Some integrations may require tokens or setup forms.

Related route: `/apps/installed/:category` shows installed apps by category and allows disconnecting installed credentials.

Primary actions:

- Install or connect an app.
- Disconnect an integration.
- Manage installed credentials.
- Add multiple accounts where supported.

### Billing

Route: `/billing/overview`, `/billing/manage`, `/billing/usage`

Billing contains subscription and usage management. It has tabs for Overview, Billing, and AI Usage.

Overview shows current plan/subscription information, lifetime deal status where relevant, monthly billing information, and links to invoices or pricing actions. Billing opens the external billing portal flow. AI Usage shows OpenAI/AI usage details for the account.

Primary actions:

- Review current subscription state.
- Subscribe or manage billing where available.
- Open billing portal/invoices.
- Review AI usage.

### Copilot

Route: `/copilot`

Copilot is an AI-powered planning assistant for turning a high-level purpose into a content plan. Users can describe their goal, choose a tone and audience stage, select a preset, generate a plan, edit plan blocks, save a local draft, and apply the plan.

Copilot remains available by direct route, but it is no longer a normal top-level navigation item.

Primary actions:

- Describe a content purpose.
- Choose tone and audience stage.
- Generate or load a preset plan.
- Edit pillars, cadence, targets, and engagement goals.
- Save or restore a draft plan.
- Apply the plan to the workspace.

## Notes For Reviewers

- The visible menu changes by role. The Users screen is admin-only.
- Several screens are useful only after integrations are connected. In particular, social-account features need a connected social credential, and AI features need the ChatGPT integration.
- The app opens authenticated users at `/dashboard`, making Dashboard the default workflow entry point.
- Existing feature routes still work even when they are grouped under Create, Engage, Library, or Settings.
- Mobile uses Dashboard, Ideas, Create, Calendar, and More in the bottom navigation. More contains Engage, Library, Settings, and admin-only Users where applicable.
