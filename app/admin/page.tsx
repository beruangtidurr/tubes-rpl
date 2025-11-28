"use client";

import { useState, useEffect } from "react";

type Course = {
  id: number;
  title: string;
  description: string;
  created_at: string;
};

type Student = {
  id: number;
  name: string;
  email: string;
};

type Enrollment = {
  id: number;
  user_id: number;
  course_id: number;
  user_name: string;
  course_title: string;
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"courses" | "students">("courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  
  // Course form state
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [isAddingCourse, setIsAddingCourse] = useState(false);

  // Enrollment form state
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchCourses();
    fetchStudents();
    fetchEnrollments();
  }, []);

  const fetchCourses = async () => {
    const res = await fetch("/api/admin/courses");
    const data = await res.json();
    setCourses(data.courses || []);
  };

  const fetchStudents = async () => {
    const res = await fetch("/api/admin/students");
    const data = await res.json();
    setStudents(data.students || []);
  };

  const fetchEnrollments = async () => {
    const res = await fetch("/api/admin/enrollments");
    const data = await res.json();
    setEnrollments(data.enrollments || []);
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingCourse(true);

    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: courseTitle,
          description: courseDescription,
        }),
      });

      if (res.ok) {
        alert("Course added successfully!");
        setCourseTitle("");
        setCourseDescription("");
        fetchCourses();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add course");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setIsAddingCourse(false);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedStudent) return;

    setIsEnrolling(true);

    try {
      const res = await fetch("/api/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse,
          userId: selectedStudent,
        }),
      });

      if (res.ok) {
        alert("Student enrolled successfully!");
        setSelectedCourse(null);
        setSelectedStudent(null);
        fetchEnrollments();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to enroll student");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleDeleteEnrollment = async (enrollmentId: number) => {
    if (!confirm("Are you sure you want to remove this enrollment?")) return;

    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Enrollment removed!");
        fetchEnrollments();
      } else {
        alert("Failed to remove enrollment");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab("courses")}
            className={`px-6 py-3 font-medium transition ${
              activeTab === "courses"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Manage Courses
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`px-6 py-3 font-medium transition ${
              activeTab === "students"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Enroll Students
          </button>
        </div>

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <div className="space-y-6">
            {/* Add Course Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Add New Course</h2>
              <form onSubmit={handleAddCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Title
                  </label>
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Introduction to Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Course description..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAddingCourse}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isAddingCourse ? "Adding..." : "Add Course"}
                </button>
              </form>
            </div>

            {/* Courses List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Existing Courses</h2>
              {courses.length === 0 ? (
                <p className="text-gray-500">No courses yet</p>
              ) : (
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.id} className="border rounded-lg p-4">
                      <h3 className="font-bold text-lg">{course.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {course.description || "No description"}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Created: {new Date(course.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === "students" && (
          <div className="space-y-6">
            {/* Enroll Student Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Enroll Student to Course</h2>
              <form onSubmit={handleEnrollStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Course
                  </label>
                  <select
                    value={selectedCourse || ""}
                    onChange={(e) => setSelectedCourse(Number(e.target.value))}
                    required
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Course --</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Student
                  </label>
                  <select
                    value={selectedStudent || ""}
                    onChange={(e) => setSelectedStudent(Number(e.target.value))}
                    required
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Student --</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.email})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isEnrolling}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isEnrolling ? "Enrolling..." : "Enroll Student"}
                </button>
              </form>
            </div>

            {/* Enrollments List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Current Enrollments</h2>
              {enrollments.length === 0 ? (
                <p className="text-gray-500">No enrollments yet</p>
              ) : (
                <div className="space-y-2">
                  {enrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex justify-between items-center border rounded p-3"
                    >
                      <div>
                        <span className="font-medium">{enrollment.user_name}</span>
                        <span className="text-gray-500 mx-2">→</span>
                        <span className="text-blue-600">{enrollment.course_title}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteEnrollment(enrollment.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
