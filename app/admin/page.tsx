"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

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

type Lecturer = {
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

type CourseAssignment = {
  id: number;
  lecturer_id: number;
  course_id: number;
  lecturer_name: string;
  course_title: string;
};

type BulkEnrollmentResult = {
  success: string[];
  failed: { email: string; reason: string }[];
  skipped: { email: string; reason: string }[];
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"courses" | "students" | "lecturers" | "bulk">("courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<CourseAssignment[]>([]);
  
  // Course form state
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [isAddingCourse, setIsAddingCourse] = useState(false);

  // Enrollment form state
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Lecturer assignment form state
  const [selectedLecturerCourse, setSelectedLecturerCourse] = useState<number | null>(null);
  const [selectedLecturer, setSelectedLecturer] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Bulk enrollment state
  const [bulkCourse, setBulkCourse] = useState<number | null>(null);
  const [uploadedEmails, setUploadedEmails] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkEnrollmentResult | null>(null);

  // Fetch data
  useEffect(() => {
    fetchCourses();
    fetchStudents();
    fetchLecturers();
    fetchEnrollments();
    fetchCourseAssignments();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

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

  const fetchLecturers = async () => {
    const res = await fetch("/api/admin/lecturers");
    const data = await res.json();
    setLecturers(data.lecturers || []);
  };

  const fetchEnrollments = async () => {
    const res = await fetch("/api/admin/enrollments");
    const data = await res.json();
    setEnrollments(data.enrollments || []);
  };

  const fetchCourseAssignments = async () => {
    const res = await fetch("/api/admin/course-assignments");
    const data = await res.json();
    setCourseAssignments(data.assignments || []);
  };

  const handleAddCourse = async () => {
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

  const handleEnrollStudent = async () => {
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

  const handleAssignLecturer = async () => {
    if (!selectedLecturerCourse || !selectedLecturer) return;

    setIsAssigning(true);

    try {
      const res = await fetch("/api/admin/course-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedLecturerCourse,
          lecturerId: selectedLecturer,
        }),
      });

      if (res.ok) {
        alert("Lecturer assigned successfully!");
        setSelectedLecturerCourse(null);
        setSelectedLecturer(null);
        fetchCourseAssignments();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to assign lecturer");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setIsAssigning(false);
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

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to remove this assignment?")) return;

    try {
      const res = await fetch(`/api/admin/course-assignments/${assignmentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Assignment removed!");
        fetchCourseAssignments();
      } else {
        alert("Failed to remove assignment");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    try {
      if (fileName.endsWith(".csv")) {
        // Parse CSV
        Papa.parse(file, {
          complete: (results: Papa.ParseResult<any>) => {
            const emails: string[] = [];
            results.data.forEach((row: any) => {
              if (Array.isArray(row) && row[0]) {
                emails.push(row[0].toString().trim());
              } else if (typeof row === "object" && row.email) {
                emails.push(row.email.toString().trim());
              } else if (typeof row === "object") {
                const firstValue = Object.values(row)[0];
                if (firstValue) emails.push(firstValue.toString().trim());
              }
            });
            setUploadedEmails(emails.filter(e => e && e.includes("@")));
          },
          error: (error: Error) => {
            alert("Error parsing CSV: " + error.message);
          },
        });
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        // Parse Excel
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        const emails: string[] = [];
        jsonData.forEach((row: any) => {
          if (Array.isArray(row) && row[0]) {
            emails.push(row[0].toString().trim());
          }
        });
        setUploadedEmails(emails.filter(e => e && e.includes("@")));
      } else {
        alert("Please upload a CSV or XLSX file");
      }
    } catch (error) {
      alert("Error reading file");
      console.error(error);
    }

    // Reset file input
    e.target.value = "";
  };

  const handleBulkEnrollment = async () => {
    if (!bulkCourse || uploadedEmails.length === 0) {
      alert("Please select a course and upload a file with emails");
      return;
    }

    setIsProcessing(true);
    setBulkResult(null);

    try {
      const res = await fetch("/api/admin/bulk-enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: bulkCourse,
          emails: uploadedEmails,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setBulkResult(data.results);
        fetchEnrollments();
      } else {
        alert(data.error || "Failed to process bulk enrollment");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearUpload = () => {
    setUploadedEmails([]);
    setBulkResult(null);
    setBulkCourse(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab("courses")}
            className={`px-6 py-3 font-medium transition whitespace-nowrap ${
              activeTab === "courses"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Manage Courses
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`px-6 py-3 font-medium transition whitespace-nowrap ${
              activeTab === "students"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Enroll Students
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`px-6 py-3 font-medium transition whitespace-nowrap ${
              activeTab === "bulk"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Bulk Enrollment
          </button>
          <button
            onClick={() => setActiveTab("lecturers")}
            className={`px-6 py-3 font-medium transition whitespace-nowrap ${
              activeTab === "lecturers"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Assign Lecturers
          </button>
        </div>

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Add New Course</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Title
                  </label>
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
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
                  onClick={handleAddCourse}
                  disabled={isAddingCourse || !courseTitle}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isAddingCourse ? "Adding..." : "Add Course"}
                </button>
              </div>
            </div>

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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Enroll Student to Course</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Course
                  </label>
                  <select
                    value={selectedCourse || ""}
                    onChange={(e) => setSelectedCourse(Number(e.target.value))}
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
                  onClick={handleEnrollStudent}
                  disabled={isEnrolling || !selectedCourse || !selectedStudent}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isEnrolling ? "Enrolling..." : "Enroll Student"}
                </button>
              </div>
            </div>

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

        {/* Bulk Enrollment Tab */}
        {activeTab === "bulk" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Bulk Enroll Students</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Course
                  </label>
                  <select
                    value={bulkCourse || ""}
                    onChange={(e) => setBulkCourse(Number(e.target.value))}
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
                    Upload File (CSV or XLSX)
                  </label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    File should contain student emails in the first column
                  </p>
                </div>

                {uploadedEmails.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="font-medium text-blue-900">
                      {uploadedEmails.length} emails loaded
                    </p>
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      {uploadedEmails.slice(0, 10).map((email, idx) => (
                        <p key={idx} className="text-sm text-blue-700">
                          {email}
                        </p>
                      ))}
                      {uploadedEmails.length > 10 && (
                        <p className="text-sm text-blue-700 font-medium">
                          ... and {uploadedEmails.length - 10} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleBulkEnrollment}
                    disabled={isProcessing || !bulkCourse || uploadedEmails.length === 0}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {isProcessing ? "Processing..." : "Enroll Students"}
                  </button>
                  <button
                    onClick={handleClearUpload}
                    disabled={isProcessing}
                    className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 disabled:bg-gray-400"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {bulkResult && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Enrollment Results</h2>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <p className="text-2xl font-bold text-green-700">
                      {bulkResult.success.length}
                    </p>
                    <p className="text-sm text-green-600">Successfully Enrolled</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <p className="text-2xl font-bold text-yellow-700">
                      {bulkResult.skipped.length}
                    </p>
                    <p className="text-sm text-yellow-600">Skipped</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded p-4">
                    <p className="text-2xl font-bold text-red-700">
                      {bulkResult.failed.length}
                    </p>
                    <p className="text-sm text-red-600">Failed</p>
                  </div>
                </div>

                {bulkResult.success.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-green-700 mb-2">
                      Successfully Enrolled:
                    </h3>
                    <div className="max-h-40 overflow-y-auto bg-green-50 rounded p-3">
                      {bulkResult.success.map((email, idx) => (
                        <p key={idx} className="text-sm text-green-800">
                          ✓ {email}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {bulkResult.skipped.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-yellow-700 mb-2">
                      Skipped:
                    </h3>
                    <div className="max-h-40 overflow-y-auto bg-yellow-50 rounded p-3">
                      {bulkResult.skipped.map((item, idx) => (
                        <p key={idx} className="text-sm text-yellow-800">
                          ⊘ {item.email} - {item.reason}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {bulkResult.failed.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-red-700 mb-2">
                      Failed:
                    </h3>
                    <div className="max-h-40 overflow-y-auto bg-red-50 rounded p-3">
                      {bulkResult.failed.map((item, idx) => (
                        <p key={idx} className="text-sm text-red-800">
                          ✗ {item.email} - {item.reason}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Lecturers Tab */}
        {activeTab === "lecturers" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Assign Lecturer to Course</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Course
                  </label>
                  <select
                    value={selectedLecturerCourse || ""}
                    onChange={(e) => setSelectedLecturerCourse(Number(e.target.value))}
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
                    Select Lecturer
                  </label>
                  <select
                    value={selectedLecturer || ""}
                    onChange={(e) => setSelectedLecturer(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Lecturer --</option>
                    {lecturers.map((lecturer) => (
                      <option key={lecturer.id} value={lecturer.id}>
                        {lecturer.name} ({lecturer.email})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAssignLecturer}
                  disabled={isAssigning || !selectedLecturerCourse || !selectedLecturer}
                  className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {isAssigning ? "Assigning..." : "Assign Lecturer"}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Current Assignments</h2>
              {courseAssignments.length === 0 ? (
                <p className="text-gray-500">No assignments yet</p>
              ) : (
                <div className="space-y-2">
                  {courseAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex justify-between items-center border rounded p-3"
                    >
                      <div>
                        <span className="font-medium">{assignment.lecturer_name}</span>
                        <span className="text-gray-500 mx-2">→</span>
                        <span className="text-purple-600">{assignment.course_title}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
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
