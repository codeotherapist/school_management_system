import { z } from "zod";

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  teachers: z.array(z.string()), // teacher id's
});

export type SubjectSchema = z.infer<typeof subjectSchema>;
export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  capacity: z.coerce.number().min(1, { message: "Capacity name is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade name is required!" }),
  supervisorId: z.coerce.string().optional(),
});

export type ClassSchema = z.infer<typeof classSchema>;

export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z.union([
    z
      .string()
      .min(8, { message: "Password must be at least 8 characters long!" }),
    z.literal(""), // allows empty string
  ]),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z.union([
    z.string().email({ message: "Invalid email address!" }),
    z.literal(""),
  ]),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  subjects: z.array(z.string()).optional(), //subject ids
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

export const studentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z.union([
    z
      .string()
      .min(8, { message: "Password must be at least 8 characters long!" }),
    z.literal(""), // allows empty string
  ]),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z.union([
    z.string().email({ message: "Invalid email address!" }),
    z.literal(""),
  ]),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  parentId: z.string().min(1, { message: "Parent Id is required!" }),
});

export type StudentSchema = z.infer<typeof studentSchema>;

export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title name is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
});

export type ExamSchema = z.infer<typeof examSchema>;

export const DAY_VALUES = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
] as const;

// Zod enum (use in schema)
export const DayEnum = z.enum(DAY_VALUES);

// TypeScript type you can reuse
export type Day = z.infer<typeof DayEnum>;

// convenient runtime array for rendering selects
export const DAYS = [...DAY_VALUES];


export const lessonSchema = z
  .object({
    id: z.coerce.number().optional(),
    name: z.string().min(1, { message: "Lesson name is required!" }),
    day: DayEnum,
    startTime: z.coerce.date({ message: "Start time is required!" }),
    endTime: z.coerce.date({ message: "End time is required!" }),
    subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
    classId: z.coerce.number().min(1, { message: "Class is required!" }),
    teacherId: z.string().min(1, { message: "Teacher is required!" }),
  })
  // ⏱ End must be after start
  .refine((d) => d.endTime > d.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  })
  // 🚫 NO LESSON AFTER 4:00 PM
  .refine(
    (d) => {
      const end = d.endTime;
      return end.getHours() < 16 || (end.getHours() === 16 && end.getMinutes() === 0);
    },
    {
      message: "Lessons cannot end after 4:00 PM",
      path: ["endTime"],
    }
  );

export type LessonSchema = z.infer<typeof lessonSchema>;


export const assignmentSchema = z
  .object({
    title: z.string().min(1, { message: "Title is required" }),
    startDate: z.coerce.date(),
    dueDate: z.coerce.date(),
    lessonId: z.coerce.number().int({ message: "Lesson is required" }),
    id: z.number().optional(),
  })
  .refine((data) => data.dueDate > data.startDate, {
    path: ["dueDate"],
    message: "Due date must be after start date",
  });

export type AssignmentSchema = z.infer<typeof assignmentSchema>;



export const resultSchema = z.object({
  id: z.number().optional(),
  score: z.coerce.number().int().min(0, { message: "Score must be at least 0" }),
  examId: z.coerce.number().optional(),
  assignmentId: z.coerce.number().optional(),
  studentId: z.string().min(1, { message: "Student is required" }),
});

export type ResultSchema = z.infer<typeof resultSchema>;



export const eventSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  classId: z.string().optional().nullable(), 
});

export type EventSchema = z.infer<typeof eventSchema>;


export const announcementSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  // Accepts string input but validates as a real date
  date: z
    .string()
    .min(1, "Date is required")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
  // classId can be number or string (from form select)
  classId: z
    .union([z.string().min(1), z.number()])
    .optional()
    .nullable()
    .transform((val) => (val === "" || val === null ? null : Number(val))),
});

export type AnnouncementSchema = z.infer<typeof announcementSchema>;