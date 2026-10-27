# Restaurant practical submission

This MERN project implements categories and foods in MongoDB through Mongoose, Express CRUD APIs, Multer photo uploads and an Axios-connected React frontend.

## Run

1. Run `npm ci` at the repository root.
2. Copy `server/.env.example` to `server/.env` and configure MongoDB and the two JWT secrets as described in the root README. Existing environment files should be preserved.
3. For a dedicated demo database only, run `npm run seed`. This replaces users, categories and foods in the configured database.
4. Run `npm run dev` and open http://localhost:5173/menu.
5. Sign in as `admin@example.com` / `Admin@123` after seeding. Use Categories and Food Items in the admin sidebar.

## Requirements and API

All endpoints below start with `/api`. Admin writes use the login cookies and the `X-CSRF-Protection: 1` header (the shared Axios client handles both).

| Feature | Endpoints |
| --- | --- |
| Category list / details | `GET /categories`, `GET /categories/:id` (signed in) |
| Public menu categories | `GET /menu/categories` |
| Category create / edit / delete | `POST /categories`, `PUT /categories/:id`, `DELETE /categories/:id` (admin) |
| Food list / details | `GET /foods`, `GET /foods/:id` (public) |
| Food create / edit / delete | `POST /foods`, `PUT /foods/:id`, `DELETE /foods/:id` (admin) |

Category fields: `name`, `description`, `image`, `isActive`. Food fields: `name`, `price`, `description`, `category`, `image`, `isAvailable`. Name and food category/price are required. Price must be a finite, nonnegative number; blank values are rejected. Description and image are optional. Category IDs are stored as ObjectId references in the `foods` collection; category documents use `categories`.

Send JSON for text-only changes or multipart form data with an `image` file for photos. Supported files are JPEG, PNG, WebP and GIF, up to 10 MB. The server checks file signatures, stores photo paths in MongoDB, and serves public menu photos from `/uploads`. Public menu photos are physically separated from private media files. Configure a production reverse proxy for both `/api` and `/uploads`; Vite proxies both locally. Preserve `server/uploads/menu` on persistent disk when deploying. Old replaced/deleted photos are retained on disk; they can be cleaned up separately after checking database references.

Food lists support `search`, `category` (ID or slug), `isAvailable`, `page`, `limit`, and `sort`. Category lists support `search`, `isActive`, pagination and sorting. A category with foods returns 409 on deletion: delete or reassign its foods first.

## Demonstration checklist

- Add a category with a description and local photo; verify its image in the category table.
- Edit its name, description and photo.
- Add a food with a price, description, selected category and local photo.
- Verify the public menu, search and category filter; refresh to verify database persistence.
- Edit the food price, category and image; verify the changed values.
- Try an empty name, blank/negative price, invalid category and a non-image upload; verify errors.
- Try deleting a category containing food; verify the explanatory error.
- Delete the food, then the category; verify both disappear.
- Run `npm test`, `npm run lint`, and `npm run build`.

Automated API tests use disposable MongoDB and include multipart uploads, image serving, CRUD, category references, validation and access control. React tests use mocked API responses.

## GitHub submission

Repository: https://github.com/theUsamaHub/mern-starter-kit

Commit and push the completed source and this guide. Never commit `.env`, `node_modules`, or uploaded files. The seed recreates demo records; uploads are runtime data. Confirm the latest commit appears on GitHub before submitting the repository link.
