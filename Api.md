# Fishing Game API Data Structure

## User Data Structure
```json
{
  "id": "unique_user_id",
  "username": "string",
  "password": "hashed_string",
  "email": "string (optional)",
  "createdAt": "ISO_timestamp",
  "gameData": {
    "money": 1000,
    "score": 5000,
    "inventory": {
      "common": 10,
      "rare": 5,
      "epic": 2,
      "legendary": 1
    },
    "upgrades": {
      "rod": 3,
      "bait": 2,
      "line": 4
    },
    "achievements": ["first_catch", "legendary_fisher"],
    "lastLogin": "ISO_timestamp",
    "totalPlayTime": 3600
  }
}
