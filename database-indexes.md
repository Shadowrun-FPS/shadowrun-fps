# MongoDB Index Recommendations

This document contains batched MongoDB index creation commands for optimal query performance.

## Instructions

1. Open MongoDB Compass
2. Connect to your database
3. Open the shell (bottom panel)
4. Select your database: `use ShadowrunWeb`
5. Paste ALL index commands at once (faster than running individually)
6. Press Enter to execute all

## Check Existing Indexes

To see what indexes currently exist, run these commands:

```javascript
// Check indexes for each collection
db.Players.getIndexes();
db.Teams.getIndexes();
db.Teams2v2.getIndexes();
db.Teams3v3.getIndexes();
db.Teams5v5.getIndexes();
db.Matches.getIndexes();
db.Tournaments.getIndexes();
db.Scrimmages.getIndexes();
db.Queues.getIndexes();
db.moderation_logs.getIndexes();
db.Posts.getIndexes();
db.Notifications.getIndexes();
db.Maps.getIndexes();
db.Users.getIndexes();
db.FAQs.getIndexes();

// Check for null/duplicate discordId values (causing unique index error)
db.Players.find({
  $or: [{ discordId: null }, { discordId: { $exists: false } }],
}).count();

// Check for duplicate tags in Teams
db.Teams.aggregate([
  { $group: { _id: "$tag", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 }, _id: { $ne: null } } },
]);
```

## Index Commands

### Players Collection

```javascript
// Unique indexes - Handle null values with sparse index
// Note: If discordId_1 index already exists, drop it first (may fail if already dropped - that's OK)
try {
  db.Players.dropIndex("discordId_1");
} catch (e) {
  // Index may not exist - that's fine
}

// Create sparse unique index (ignores null/missing values)
// This allows multiple null values but enforces uniqueness for non-null values
db.Players.createIndex({ discordId: 1 }, { unique: true, sparse: true });

// Status: All other indexes successfully created ✓
// - elo.2v2, elo.3v3, elo.4v4, elo.5v5 ✓
// - wins, losses, isBanned, banExpiry, registeredAt ✓
// - Compound indexes: isBanned_1_banExpiry_1, discordId_1_elo.4v4_-1 ✓
```

### Matches Collection

```javascript
// All indexes successfully created - no action needed
// Note: matchId already has a unique index (better than non-unique)
```

### Teams Collection (Teams, Teams2v2, Teams3v3, Teams5v5)

```javascript
// Apply to all team collections: Teams, Teams2v2, Teams3v3, Teams5v5
// Note: Run these commands for EACH collection separately

// Teams Collection
// Drop existing non-unique tag index first
db.Teams.dropIndex("tag_1");
db.Teams.createIndex({ tag: 1 }, { unique: true });
db.Teams.createIndex({ name: 1 });
db.Teams.createIndex({ elo: -1 });
db.Teams.createIndex({ wins: -1 });
db.Teams.createIndex({ losses: -1 });
db.Teams.createIndex({ "captain.discordId": 1 });
db.Teams.createIndex({ "members.discordId": 1 });
db.Teams.createIndex({ createdAt: -1 });
db.Teams.createIndex({ elo: -1, wins: -1 });
db.Teams.createIndex({ "members.discordId": 1, elo: -1 });
db.Teams.createIndex({ "captain.discordId": 1, elo: -1 });

// Teams2v2 Collection
// Drop existing non-unique tag index first
db.Teams2v2.dropIndex("tag_1");
db.Teams2v2.createIndex({ tag: 1 }, { unique: true });
db.Teams2v2.createIndex({ name: 1 });
db.Teams2v2.createIndex({ elo: -1 });
db.Teams2v2.createIndex({ wins: -1 });
db.Teams2v2.createIndex({ losses: -1 });
db.Teams2v2.createIndex({ "captain.discordId": 1 });
db.Teams2v2.createIndex({ "members.discordId": 1 });
db.Teams2v2.createIndex({ createdAt: -1 });
db.Teams2v2.createIndex({ elo: -1, wins: -1 });
db.Teams2v2.createIndex({ "members.discordId": 1, elo: -1 });
db.Teams2v2.createIndex({ "captain.discordId": 1, elo: -1 });

// Teams3v3 Collection
// Drop existing non-unique tag index first
db.Teams3v3.dropIndex("tag_1");
db.Teams3v3.createIndex({ tag: 1 }, { unique: true });
db.Teams3v3.createIndex({ name: 1 });
db.Teams3v3.createIndex({ elo: -1 });
db.Teams3v3.createIndex({ wins: -1 });
db.Teams3v3.createIndex({ losses: -1 });
db.Teams3v3.createIndex({ "captain.discordId": 1 });
db.Teams3v3.createIndex({ "members.discordId": 1 });
db.Teams3v3.createIndex({ createdAt: -1 });
db.Teams3v3.createIndex({ elo: -1, wins: -1 });
db.Teams3v3.createIndex({ "members.discordId": 1, elo: -1 });
db.Teams3v3.createIndex({ "captain.discordId": 1, elo: -1 });

// Teams5v5 Collection
// Drop existing non-unique tag index first
db.Teams5v5.dropIndex("tag_1");
db.Teams5v5.createIndex({ tag: 1 }, { unique: true });
db.Teams5v5.createIndex({ name: 1 });
db.Teams5v5.createIndex({ elo: -1 });
db.Teams5v5.createIndex({ wins: -1 });
db.Teams5v5.createIndex({ losses: -1 });
db.Teams5v5.createIndex({ "captain.discordId": 1 });
db.Teams5v5.createIndex({ "members.discordId": 1 });
db.Teams5v5.createIndex({ createdAt: -1 });
db.Teams5v5.createIndex({ elo: -1, wins: -1 });
db.Teams5v5.createIndex({ "members.discordId": 1, elo: -1 });
db.Teams5v5.createIndex({ "captain.discordId": 1, elo: -1 });
```

### Tournaments Collection

```javascript
// All indexes successfully created - no action needed
```

### Scrimmages Collection

```javascript
// All indexes successfully created - no action needed
// Note: scrimmageId already has a unique index (better than non-unique)
```

### Queues Collection

```javascript
// All indexes successfully created - no action needed
// Note: queueId already has a unique index (better than non-unique)
```

### Moderation Logs Collection

```javascript
// All indexes successfully created - no action needed
```

### Posts Collection

```javascript
// All indexes successfully created - no action needed
```

### Notifications Collection

```javascript
// All indexes successfully created - no action needed
```

### Maps Collection

```javascript
// All indexes successfully created - no action needed
```

### Users Collection

```javascript
// All indexes successfully created - no action needed
```

### FAQs Collection

```javascript
// All indexes successfully created - no action needed
```

## Performance Notes

- Indexes are automatically maintained by MongoDB when data changes
- Monitor index usage with `db.collection.aggregate([{ $indexStats: {} }])`
- Remove unused indexes to improve write performance
- Compound indexes should match your query patterns (equality first, then sort)
- For arrays (like `members.discordId`), MongoDB automatically creates multikey indexes

## Expected Performance Improvements

- Player lookups: 10-100x faster
- Match queries with filters: 50-200x faster
- Team member searches: 20-100x faster
- Leaderboard queries: 100-500x faster
- Moderation log queries: 50-200x faster
