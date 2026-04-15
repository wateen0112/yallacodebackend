# YallaCode Backend API Usage Map

## Base Info

- Base URL (local): `http://localhost:5000` (or `PORT` from `.env`)
- API docs UI: `GET /api-docs`
- Health check: `GET /api/health`

## API Secret Auth

- Protected paths: `/api/projects`, `/api/reviews`, `/api/upload`
- Required header for protected paths: `x-api-secret: <BACKEND_API_SECRET>`
- Public paths (no secret required): `/api/health`, `/api-docs`

## Middleware and Behavior

- Security headers: `helmet`
- CORS enabled globally
- JSON body limit: `10mb`
- URL-encoded bodies enabled
- Request logging prints method, URL, status, duration, and IP
- Global error format:
  - `success: false`
  - `message: "<error message>"`
- Rate limiter exists (5 req/min/IP) but is currently disabled in `server.js`

## Route Map

### 1) Health

#### `GET /api/health`

- Purpose: confirms server is running
- Auth: public
- Success response:

```json
{
  "success": true,
  "message": "Server is running"
}
```

---

### 2) Projects

Base path: `/api/projects`

#### `GET /api/projects`

- Purpose: list projects with pagination, search, and sorting
- Auth: requires `x-api-secret`
- Query params:
  - `page` (number, default `1`)
  - `limit` (number, default `10`)
  - `search` (string): matches `title` or `technologies`
  - `sort` (string, default `-createdAt`) e.g. `title`, `-createdAt`
- Success response:

```json
{
  "success": true,
  "data": [/* project objects */],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalProjects": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### `GET /api/projects/:id`

- Purpose: fetch one project by MongoDB id
- Auth: requires `x-api-secret`
- Path params:
  - `id` (string, Mongo ObjectId)
- Success response:

```json
{
  "success": true,
  "data": {
    "image": "https://...",
    "title": "Project title",
    "shortDescription": "Short text",
    "longDescription": "Long text",
    "technologies": ["Node.js", "MongoDB"],
    "demoLink": "https://...",
    "createdAt": "2026-04-15T12:00:00.000Z",
    "updatedAt": "2026-04-15T12:00:00.000Z"
  }
}
```

- Not found:

```json
{
  "success": false,
  "message": "Project not found"
}
```

#### `POST /api/projects`

- Purpose: create a new project
- Auth: requires `x-api-secret`
- Content-Type: `application/json`
- Required body fields:
  - `image` (string)
  - `title` (string)
  - `shortDescription` (string)
  - `longDescription` (string)
  - `technologies` (string[])
  - `demoLink` (string)
- Success response (`201`):

```json
{
  "success": true,
  "data": { /* created project */ },
  "message": "Project created successfully"
}
```

---

### 3) Reviews

Base path: `/api/reviews`

#### `GET /api/reviews`

- Purpose: list all reviews (newest first)
- Auth: requires `x-api-secret`
- Success response:

```json
{
  "success": true,
  "data": [/* review objects */]
}
```

#### `POST /api/reviews`

- Purpose: create a review or update existing one based on `email`
- Auth: requires `x-api-secret`
- Content-Type: `application/json`
- Required body fields:
  - `name` (string)
  - `email` (string, unique)
  - `comment` (string)
  - `rating` (number, 1-5)
- Behavior:
  - If review with same email exists: update and return `200`
  - Else: create and return `201`
- Update success (`200`):

```json
{
  "success": true,
  "data": { /* updated review */ },
  "message": "Review updated successfully"
}
```

- Create success (`201`):

```json
{
  "success": true,
  "data": { /* created review */ },
  "message": "Review created successfully"
}
```

#### `GET /api/reviews/stats`

- Purpose: aggregated review metrics
- Auth: requires `x-api-secret`
- Success response:

```json
{
  "success": true,
  "data": {
    "totalReviews": 10,
    "averageRating": 4.2,
    "ratingDistribution": {
      "1": 0,
      "2": 1,
      "3": 1,
      "4": 3,
      "5": 5
    }
  }
}
```

---

### 4) Upload

Base path: `/api/upload`

#### `POST /api/upload`

- Purpose: upload one image file and return Cloudinary URL
- Auth: requires `x-api-secret`
- Content-Type: `multipart/form-data`
- Form field:
  - `image` (file, required)
- Constraints:
  - Only image MIME types
  - Max size: `2MB`
- Success response:

```json
{
  "success": true,
  "data": {
    "imageUrl": "https://res.cloudinary.com/.../image.jpg"
  }
}
```

- Common errors:
  - No file uploaded
  - Non-image file
  - File too large (`Max size is 2MB`)

## Data Models (Quick Reference)

### Project

- `image: string` (required)
- `title: string` (required)
- `shortDescription: string` (required)
- `longDescription: string` (required)
- `technologies: string[]` (required)
- `demoLink: string` (required)
- `createdAt`, `updatedAt` (timestamps)

### Review

- `name: string` (required)
- `email: string` (required, unique, lowercase)
- `comment: string` (required)
- `rating: number` (required, min 1, max 5)
- `createdAt`, `updatedAt` (timestamps)

## Suggested Call Order (Frontend Flow)

1. `GET /api/health` (optional startup check)
2. `GET /api/projects?page=1&limit=10`
3. `POST /api/upload` (if admin adds project image)
4. `POST /api/projects` (create project using uploaded `imageUrl`)
5. `GET /api/reviews` and `GET /api/reviews/stats`
6. `POST /api/reviews` (create/update customer review)

API_SECRET=ab557823322001c34d468e582c5683b26dd125e0a2b40f84757386ebb8f3303035444f1433313469a2d9b8c0c0555d98
