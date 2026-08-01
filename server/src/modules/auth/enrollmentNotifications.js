import { NOTIFICATION_TYPES } from "@ayah/shared";

export function buildEnrollmentAdminNotification({ parent, children, result }) {
  return {
    type: NOTIFICATION_TYPES.SUBSCRIPTION_CREATED,
    titleAr: `طلب تسجيل جديد: ولي الأمر ${parent.name}`,
    titleEn: `New enrollment: parent ${parent.name}`,
    bodyAr: `تم تسجيل ${children.length} طالب. اضغط لعرض تفاصيل ولي الأمر.`,
    bodyEn: `${children.length} student(s) enrolled. Open the parent's details.`,
    link: `/dashboard/users/${result.parentId}`,
    dataJson: {
      enrollmentType: "FAMILY",
      parentId: result.parentId,
      students: result.children.map((createdChild, index) => ({
        id: createdChild.studentId,
        name: children[index].name,
        link: `/dashboard/users/${createdChild.studentId}`,
      })),
    },
  };
}
