// folders and file structure
modules/: feature-based (chat, leads, users…). Everything related to a feature stays together.

routes: endpoints only (call service, return response).

service: Prisma logic + business rules. No req/res.

validators: zod/joi schemas for body/query/params.

shared/: reusable stuff used across modules (common validation, error class, pagination, helpers).

middlewares/: auth, validation runner, error handler.

prisma/: prisma client + db helpers.
src/
app.ts
server.ts

config/
env.ts
cors.ts

prisma/
client.ts

middlewares/
auth.middleware.ts
error.middleware.ts
validate.middleware.ts

modules/
auth/
auth.routes.ts
auth.service.ts
auth.validators.ts
auth.types.ts
auth.tokens.ts

    chat/
      chat.routes.ts
      chat.service.ts
      chat.validators.ts
      chat.types.ts

    leads/
      leads.routes.ts
      leads.service.ts
      leads.validators.ts
      leads.types.ts

shared/
validators/
common.schemas.ts
utils/
asyncHandler.ts
pick.ts
http/
ApiError.ts
response.ts
constants/
roles.ts
pagination.ts
db/
transactions.ts

types/
express.d.ts ✅ augment req.user
jwt.ts ✅ jwt payload types
common.ts ✅ shared types (Pagination, Sort, etc.)

uploads/
jobs/
fileUpload.job.ts
fileCleanup.job.ts
