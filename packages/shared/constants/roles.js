// User roles (mirrors prisma enum UserRole). ADMIN = the teacher.
export const USER_ROLES = {
  ADMIN: "ADMIN",
  PARENT: "PARENT",
  STUDENT: "STUDENT",
};

// Relationship of a parent account to a student (mirrors prisma ParentRelation).
export const PARENT_RELATIONS = {
  FATHER: "FATHER",
  MOTHER: "MOTHER",
  GUARDIAN: "GUARDIAN",
  OTHER: "OTHER",
};
