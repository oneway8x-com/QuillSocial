# Seed Scripts

## Generate Default Pillars

### Quick Start

```bash
# Generate pillars for the first user in the database
yarn seed:pillars

# Or specify a user ID
yarn seed:pillars 123
```

### What It Does

Creates 4 default content pillars:
1. **Build in Public** (indigo) 
2. **Founder Lessons** (cyan)
3. **Client Wins** (green)
4. **Playbooks** (orange)

### Features

- ✅ Automatically finds the first user if no ID provided
- ✅ Skips pillars that already exist
- ✅ Restores soft-deleted pillars
- ✅ Shows detailed summary with idea counts
- ✅ Error handling for each pillar

### Example Output

```
📍 No userId provided, using first user: test@example.com (ID: 2)

👤 Generating pillars for: test@example.com (ID: 2)

✅ Created pillar: Build in Public
✅ Created pillar: Founder Lessons
✅ Created pillar: Client Wins
✅ Created pillar: Playbooks

==================================================
📊 SUMMARY
==================================================
✅ Created/Restored: 4
⏭️  Skipped (already exists): 0
❌ Errors: 0
==================================================

📋 Current Pillars:
   • Build in Public (bg-indigo-600) - 0 ideas
   • Founder Lessons (bg-cyan-500) - 0 ideas
   • Client Wins (bg-green-600) - 0 ideas
   • Playbooks (bg-orange-500) - 0 ideas

✨ Done!
```

### Script Location

`scripts/seed-pillars.ts`

### Alternative Usage

You can also run it directly:

```bash
npx tsx scripts/seed-pillars.ts [userId]
```

## Related

- See `docs/PILLAR_MANAGEMENT.md` for UI documentation
- Use the PillarManager component in the app for interactive management
- Use `yarn prisma studio` to view pillars in the database
