// app/context/CourseContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type CourseInfo = {
  id: string;
  title: string;
  description?: string;
} | null;

type CourseContextType = {
  selectedCourse: CourseInfo;
  setSelectedCourse: (course: CourseInfo) => void;
  selectedAssignment: number | null;
  setSelectedAssignment: (assignment: number | null) => void;
};

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: ReactNode }) {
  const [selectedCourse, setSelectedCourse] = useState<CourseInfo>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);

  return (
    <CourseContext.Provider
      value={{
        selectedCourse,
        setSelectedCourse,
        selectedAssignment,
        setSelectedAssignment,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse() {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useCourse must be used within CourseProvider");
  }
  return context;
}