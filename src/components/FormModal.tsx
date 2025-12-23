"use client";

import {
  deleteAnnouncement,
  deleteAssignment,
  deleteClass,
  deleteEvent,
  deleteExam,
  deleteLesson,
  deleteResult,
  deleteStudent,
  deleteSubject,
  deleteTeacher,
  deleteParent,
  restoreTeacher,
  restoreStudent,
} from "@/lib/actions";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { FormContainerProps } from "./FormContainer";

/* DELETE ACTION MAP */
const deleteActionMap: any = {
  subject: deleteSubject,
  class: deleteClass,
  teacher: deleteTeacher,
  student: deleteStudent,
  parent: deleteParent,
  parents: deleteParent,
  exam: deleteExam,
  lesson: deleteLesson,
  assignment: deleteAssignment,
  result: deleteResult,
  event: deleteEvent,
  announcement: deleteAnnouncement,
};

/* RESTORE ACTION MAP */
const restoreActionMap: any = {
  teacher: restoreTeacher,
  student: restoreStudent,
};

/* DYNAMIC FORMS */
const TeacherForm = dynamic(() => import("./forms/TeacherForm"));
const StudentForm = dynamic(() => import("./forms/StudentForm"));
const ParentForm = dynamic(() => import("./forms/ParentForm"));
const SubjectForm = dynamic(() => import("./forms/SubjectForm"));
const ClassForm = dynamic(() => import("./forms/ClassForm"));
const ExamForm = dynamic(() => import("./forms/ExamForm"));
const LessonForm = dynamic(() => import("./forms/LessonForm"));
const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"));
const ResultForm = dynamic(() => import("./forms/ResultForm"));
const EventForm = dynamic(() => import("./forms/EventForm"));
const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm"));

/* FORM COMPONENT LIST */
const forms: any = {
  teacher: (setOpen: any, type: any, data: any, rel: any) => (
    <TeacherForm type={type} data={data} setOpen={setOpen} relatedData={rel} />
  ),
  student: (setOpen: any, type: any, data: any, rel: any) => (
    <StudentForm type={type} data={data} setOpen={setOpen} relatedData={rel} />
  ),
  parent: (setOpen: any, type: any, data: any) => (
    <ParentForm type={type} data={data} setOpen={setOpen} />
  ),
  parents: (setOpen: any, type: any, data: any) => (
    <ParentForm type={type} data={data} setOpen={setOpen} />
  ),
  subject: (setOpen: any, type: any, data: any, rel: any) => (
    <SubjectForm type={type} data={data} setOpen={setOpen} relatedData={rel} />
  ),
  class: (setOpen: any, type: any, data: any, rel: any) => (
    <ClassForm type={type} data={data} setOpen={setOpen} relatedData={rel} />
  ),
  exam: (setOpen: any, type: any, data: any, rel: any) => (
    <ExamForm type={type} data={data} setOpen={setOpen} relatedData={rel} />
  ),
  lesson: (setOpen: any, type: any, data: any, rel: any) => (
    <LessonForm type={type} data={data} setOpen={setOpen} relatedData={rel} />
  ),
  assignment: (setOpen: any, type: any, data: any, rel: any) => (
    <AssignmentForm type={type} data={data} setOpen={setOpen} relatedData={rel} />
  ),
  result: (setOpen: any, type: any, data: any, rel: any) => (
    <ResultForm type={type} data={data} setOpen={setOpen} relatedData={rel} />
  ),
  event: (setOpen: any, type: any, data: any, rel: any) => (
    <EventForm type={type} data={data} setOpen={setOpen} relatedData={rel} />
  ),
  announcement: (setOpen: any, type: any, data: any, rel: any) => (
    <AnnouncementForm type={type} data={data} setOpen={setOpen} relatedData={rel} />
  ),
};

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
}: FormContainerProps & { relatedData?: any }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const buttonClasses =
    "w-8 h-8 min-w-8 min-h-8 flex items-center justify-center rounded-full";

  const bgColor =
    type === "create"
      ? "bg-lamaYellow"
      : type === "update"
      ? "bg-lamaSky"
      : type === "restore"
      ? "bg-blue-500"
      : "bg-lamaPurple";

  const Form = () => {
    const action =
      type === "delete"
        ? deleteActionMap[table]
        : type === "restore"
        ? restoreActionMap[table]
        : null;

    // Only call useFormState when action exists (delete/restore)
    const [state, formAction] =
      action !== null
        ? useFormState(action as any, { success: false, error: false })
        : [{ success: false, error: false }, () => {}];

    useEffect(() => {
      if (state.success) {
        toast(
          type === "create"
            ? `${table} created!`
            : type === "update"
            ? `${table} updated!`
            : type === "delete"
            ? `${table} deleted!`
            : `${table} restored!`
        );
        setOpen(false);
        router.refresh();
      }
    }, [state, router]);

    // show toast when server action returns an error/message
    useEffect(() => {
      if (state && (state as any).error) {
        const errVal = (state as any).error;
        const msg =
          typeof errVal === "string"
            ? errVal
            : typeof (state as any).message === "string"
            ? (state as any).message
            : "Operation failed";
        toast.error(msg);
      }
    }, [state]);

    /* DELETE FORM with force checkbox */
 if (type === "delete" && id) {

  // ✅ SPECIAL DELETE UI ONLY FOR PARENT
  if (table === "parent") {
    return (
      <form action={formAction} className="p-4 flex flex-col gap-4">
        <input type="hidden" name="id" value={id} />

        <span className="text-center font-medium">
          Are you sure you want to delete this parent?
        </span>

      <label className="flex items-center justify-center w-full gap-2 text-sm text-gray-700 text-center">
  <input type="checkbox" name="force" value="1" className="w-4 h-4" />
  <span>
    Also delete <strong>all students</strong> assigned to this parent
  </span>
</label>
        <div className="flex gap-2 mt-2 items-center justify-center">
          <button
            type="submit"
            className="bg-red-700 text-white py-2 px-4 rounded-md"
          >
            Delete
          </button>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  // ✅ SIMPLE DELETE UI FOR STUDENT + ALL OTHERS
  return (
    <form action={formAction} className="p-4 flex flex-col gap-4 items-center">
      <input type="hidden" name="id" value={id} />

      <span className="text-center font-medium">
        Are you sure you want to delete this {table}?
      </span>

      <button
        type="submit"
        className="bg-red-700 text-white py-2 px-4 rounded-md mt-2"
      >
        Delete
      </button>
    </form>
  );
}


    /* RESTORE FORM */
    if (type === "restore" && id) {
      return (
        <form action={formAction} className="p-4 flex flex-col gap-4">
          <input type="hidden" name="id" value={id} />
          <span className="text-center font-medium">
            Restore this deleted {table}?
          </span>
          <button
            type="submit"
            className="bg-green-600 text-white py-2 px-4 rounded-md w-max self-center"
          >
            Restore
          </button>
        </form>
      );
    }

    /* CREATE / UPDATE FORM */
    if (type === "create" || type === "update") {
      return forms[table](setOpen, type, data, relatedData);
    }

    return "Form not found!";
  };

  return (
    <>
      <button
        className={`${buttonClasses} ${bgColor}`}
        style={{ padding: 0 }}
        onClick={() => setOpen(true)}
      >
        <Image src={`/${type}.png`} alt="" width={16} height={16} />
      </button>

      {open && (
        <div className="w-screen h-screen fixed left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[60%] lg:w-[50%] 2xl:w-[40%]">
            <Form />
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
