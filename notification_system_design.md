# Stage 1

## Core Notification Actions
- Create notification (server → student)
- Fetch all notifications for a student
- Mark notification as read
- Mark all as read
- Delete a notification

## REST API Design

### GET /api/notifications
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "notifications": [{ "id": "uuid", "type": "Placement|Result|Event", "message": "...", "isRead": false, "createdAt": "2026-04-22T17:51:30Z" }] }
```

### PATCH /api/notifications/:id/read
Headers: `Authorization: Bearer <token>`
Response: `{ "success": true }`

### PATCH /api/notifications/read-all
Response: `{ "success": true, "updated": 42 }`

### DELETE /api/notifications/:id
Response: `{ "success": true }`

### POST /api/notifications (internal/admin use)
Body: `{ "studentId": "uuid", "type": "Placement", "message": "Google hiring" }`

## Real-Time Mechanism: WebSockets
Use **WebSockets** (e.g. Socket.IO). On HR triggering "Notify All":
- Server emits event `notification:new` to all connected student sockets
- Client listens and appends to UI without polling

---

# Stage 2

## Recommended DB: PostgreSQL

**Why PostgreSQL:**
- Strong relational integrity (students → notifications foreign key)
- Enum type support for notificationType
- Excellent index support for the access patterns we need
- JSONB if we need flexible metadata later

## Schema

```sql
CREATE TYPE notification_type AS ENUM ('Placement', 'Result', 'Event');

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Scaling Problems & Solutions
- **Volume**: 50k students × many notifications = millions of rows → **Partition by student_id or date**
- **Read heavy**: Add indexes (see Stage 3)
- **Write spikes**: Use async message queue (see Stage 5)

---

# Stage 3

## Is the query accurate?
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```
Functionally correct, but slow at scale.

## Why is it slow?
- Full table scan on 5,000,000 rows with no composite index
- `SELECT *` fetches all columns unnecessarily
- No LIMIT — returns potentially thousands of rows

## Fix: Add a composite index
```sql
CREATE INDEX idx_notifications_student_unread
ON notifications (student_id, is_read, created_at DESC);
```
This turns an O(n) scan into an O(log n) index seek. Cost drops from ~5M row scan to a few hundred rows.

## Is indexing every column good advice?
**No.** Adding indexes on every column is harmful because:
- Each index slows down INSERT/UPDATE/DELETE (index must be updated too)
- Wastes disk space significantly
- The query planner may pick the wrong index
- Only index columns used in WHERE, ORDER BY, or JOIN

## Query: Placement notifications in last 7 days
```sql
SELECT * FROM notifications
WHERE type = 'Placement'
  AND created_at >= NOW() - INTERVAL '7 days';
```
Add index: `CREATE INDEX idx_notifications_type_date ON notifications (type, created_at DESC);`

---

# Stage 4

## Problem
DB overwhelmed by per-page-load notification fetches for 50k students.

## Solutions & Tradeoffs

### 1. Redis Caching (Recommended)
Cache `notifications:{studentId}` in Redis with TTL of 60s.
- ✅ Dramatically reduces DB reads
- ✅ Fast (sub-millisecond)
- ❌ Stale data for up to TTL duration
- ❌ Cache invalidation complexity (must bust cache on new notification)

### 2. HTTP Cache Headers
Return `Cache-Control: max-age=30` from the API.
- ✅ Zero infra cost
- ❌ Not suitable for personalized data

### 3. Pagination
Never fetch all notifications — use cursor-based pagination.
- ✅ Reduces payload size dramatically
- ✅ Pairs well with caching
- ❌ UX complexity

**Best approach**: Redis cache + pagination + WebSocket push to invalidate cache on new notification.

---

# Stage 5

## Problems with the current implementation
```
for student_id in student_ids:
    send_email(student_id, message)   # synchronous, blocks loop
    save_to_db(student_id, message)
    push_to_app(student_id, message)
```
- Synchronous loop over 50,000 students — extremely slow (potentially hours)
- If `send_email` fails at student 25,000, no retry mechanism
- Email + DB are coupled — if DB fails, email already sent (inconsistency)
- No parallelism

## Should DB save and email happen together?
**No — they should be decoupled.** DB save should happen first and be treated as the source of truth. Email is a side effect. Use the **Outbox Pattern**: save to DB first, then emit to a queue for email delivery.

## Redesigned Approach: Message Queue

```
function notify_all(student_ids: array, message: string):
    # Step 1: Bulk insert into DB (fast, transactional)
    bulk_save_to_db(student_ids, message)
    
    # Step 2: Push all jobs to message queue (e.g. RabbitMQ / BullMQ)
    for student_id in student_ids:
        queue.push({ student_id, message, type: "notify_all" })
    
    # Step 3: Workers process in parallel
    # Worker 1: send_email(student_id, message) with retry on failure
    # Worker 2: push_to_app(student_id, message)
```

**Benefits:**
- DB write is fast and atomic
- Email workers retry on failure (200 failures get requeued automatically)
- Parallel processing — 10 workers × 5000 students each = much faster
- DB and email are decoupled

---

# Stage 6

## Priority Inbox Approach

Priority is determined by: **type weight + recency**

Type weights: `Placement = 3`, `Result = 2`, `Event = 1`

Score formula: `score = typeWeight × 1000 + (timestamp in unix seconds)`

This ensures type dominates but among same-type, newer ones rank higher.

## Maintaining Top 10 Efficiently
Use a **min-heap of size 10**. For each incoming notification:
- If heap size < 10, push it
- Else if new notification score > heap minimum, pop min and push new one

This is O(log 10) = O(1) per insertion — optimal for streaming.