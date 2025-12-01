"use client";

import { useState, useEffect } from "react";

type Course = {
  id: number;
  title: string;
  description: string;
  enrolled_students: number;
};

type Assignment = {
  id: number;
  course_id: number;
  title: string;
  description: string;
  num_teams: number;
  max_members_per_team: number;
  assignment_due_date: string | null;
  grading_due_date: string | null;
  created_at: string;
  course_title: string;
  teams_created: number;
};

type TeamMember = {
  id: number;
  user_id: number;
  user_name: string;
  joined_at: string;
};

type Team = {
  id: number;
  name: string;
  max_members: number;
  current_members: number;
  created_at: string;
  members: TeamMember[];
};

export default function LecturerPage() {
  const [activeTab, setActiveTab] = useState<"courses" | "assignments">("courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  // Create assignment form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [numTeams, setNumTeams] = useState(5);
  const [maxMembers, setMaxMembers] = useState(5);
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [gradingDueDate, setGradingDueDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit assignment state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      fetchTeams(selectedAssignment);
    }
  }, [selectedAssignment]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/lecturer/courses");
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/lecturer/assignments");
      const data = await res.json();
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const fetchTeams = async (assignmentId: number) => {
    try {
      const res = await fetch(`/api/lecturer/assignments/${assignmentId}/teams`);
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedCourse || !assignmentTitle || numTeams < 1 || maxMembers < 1) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate dates
    if (assignmentDueDate && gradingDueDate) {
      const assignmentDate = new Date(assignmentDueDate);
      const gradingDate = new Date(gradingDueDate);
      
      if (gradingDate < assignmentDate) {
        alert("Grading due date must be after assignment due date");
        return;
      }
    }

    setIsCreating(true);

    try {
      // Convert datetime-local strings to ISO format
      const assignmentDueDateISO = assignmentDueDate ? new Date(assignmentDueDate).toISOString() : null;
      const gradingDueDateISO = gradingDueDate ? new Date(gradingDueDate).toISOString() : null;

      const res = await fetch("/api/lecturer/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse,
          title: assignmentTitle,
          description: assignmentDescription,
          numTeams: numTeams,
          maxMembersPerTeam: maxMembers,
          assignmentDueDate: assignmentDueDateISO,
          gradingDueDate: gradingDueDateISO,
        }),
      });

      if (res.ok) {
        alert("Assignment created successfully!");
        setShowCreateForm(false);
        resetForm();
        fetchAssignments();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create assignment");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setAssignmentTitle("");
    setAssignmentDescription("");
    setSelectedCourse(null);
    setNumTeams(5);
    setMaxMembers(5);
    setAssignmentDueDate("");
    setGradingDueDate("");
  };

  const handleViewTeams = (assignmentId: number) => {
    setSelectedAssignment(assignmentId);
  };

  const handleBackToAssignments = () => {
    setSelectedAssignment(null);
    setTeams([]);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setAssignmentTitle(assignment.title);
    setAssignmentDescription(assignment.description || "");
    setNumTeams(assignment.num_teams);
    setMaxMembers(assignment.max_members_per_team);
    
    // Format dates for datetime-local input
    if (assignment.assignment_due_date) {
      const date = new Date(assignment.assignment_due_date);
      setAssignmentDueDate(date.toISOString().slice(0, 16));
    } else {
      setAssignmentDueDate("");
    }
    
    if (assignment.grading_due_date) {
      const date = new Date(assignment.grading_due_date);
      setGradingDueDate(date.toISOString().slice(0, 16));
    } else {
      setGradingDueDate("");
    }
    
    setShowEditForm(true);
  };

  const handleUpdateAssignment = async () => {
    if (!assignmentTitle || numTeams < 1 || maxMembers < 1) {
      alert("Please fill in all required fields");
      return;
    }

    if (assignmentDueDate && gradingDueDate) {
      const assignmentDate = new Date(assignmentDueDate);
      const gradingDate = new Date(gradingDueDate);
      
      if (gradingDate < assignmentDate) {
        alert("Grading due date must be after assignment due date");
        return;
      }
    }

    setIsUpdating(true);

    try {
      const assignmentDueDateISO = assignmentDueDate ? new Date(assignmentDueDate).toISOString() : null;
      const gradingDueDateISO = gradingDueDate ? new Date(gradingDueDate).toISOString() : null;

      const res = await fetch(`/api/lecturer/assignments/${editingAssignment?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: assignmentTitle,
          description: assignmentDescription,
          numTeams: numTeams,
          maxMembersPerTeam: maxMembers,
          assignmentDueDate: assignmentDueDateISO,
          gradingDueDate: gradingDueDateISO,
        }),
      });

      if (res.ok) {
        alert("Assignment updated successfully!");
        setShowEditForm(false);
        setEditingAssignment(null);
        resetForm();
        fetchAssignments();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update assignment");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to delete this assignment? This will also delete all teams and cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/lecturer/assignments/${assignmentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Assignment deleted successfully!");
        fetchAssignments();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete assignment");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Lecturer Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

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
            My Courses
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-6 py-3 font-medium transition ${
              activeTab === "assignments"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Assignments & Teams
          </button>
        </div>

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Courses I Teach</h2>
              {courses.length === 0 ? (
                <p className="text-gray-500">No courses assigned yet</p>
              ) : (
                <div className="grid gap-4">
                  {courses.map((course) => (
                    <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <h3 className="font-bold text-lg text-blue-600">{course.title}</h3>
                      <p className="text-gray-600 text-sm mt-2">
                        {course.description || "No description"}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">{course.enrolled_students}</span> students enrolled
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === "assignments" && (
          <div className="space-y-6">
            {/* View Teams for Selected Assignment */}
            {selectedAssignment ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Teams Overview</h2>
                  <button
                    onClick={handleBackToAssignments}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    ← Back to Assignments
                  </button>
                </div>

                {teams.length === 0 ? (
                  <p className="text-gray-500">No teams found</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {teams.map((team) => (
                      <div key={team.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-lg">{team.name}</h3>
                          <span className={`text-sm px-2 py-1 rounded ${
                            team.current_members >= team.max_members
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}>
                            {team.current_members}/{team.max_members}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {team.members.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No members yet</p>
                          ) : (
                            team.members.map((member) => (
                              <div key={member.id} className="bg-white rounded p-2 text-sm border">
                                <p className="font-medium">{member.user_name}</p>
                                <p className="text-xs text-gray-500">
                                  Joined: {new Date(member.joined_at).toLocaleDateString()}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Create Assignment Button */}
                {!showCreateForm && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      + Create New Assignment
                    </button>
                  </div>
                )}

                {/* Create Assignment Form */}
                {showCreateForm && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold">Create New Assignment</h2>
                      <button
                        onClick={() => {
                          setShowCreateForm(false);
                          resetForm();
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Course *
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
                          Assignment Title *
                        </label>
                        <input
                          type="text"
                          value={assignmentTitle}
                          onChange={(e) => setAssignmentTitle(e.target.value)}
                          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Project 1: Web Development"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={assignmentDescription}
                          onChange={(e) => setAssignmentDescription(e.target.value)}
                          rows={3}
                          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Assignment description..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Number of Teams *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={numTeams}
                            onChange={(e) => setNumTeams(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Members per Team *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={maxMembers}
                            onChange={(e) => setMaxMembers(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assignment Due Date
                          </label>
                          <input
                            type="datetime-local"
                            value={assignmentDueDate}
                            onChange={(e) => setAssignmentDueDate(e.target.value)}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">When students must submit</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Grading Due Date
                          </label>
                          <input
                            type="datetime-local"
                            value={gradingDueDate}
                            onChange={(e) => setGradingDueDate(e.target.value)}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">Your deadline to complete grading</p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleCreateAssignment}
                          disabled={isCreating}
                          className="flex-1 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          {isCreating ? "Creating..." : "Create Assignment"}
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateForm(false);
                            resetForm();
                          }}
                          disabled={isCreating}
                          className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Assignment Form */}
                {showEditForm && editingAssignment && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold">Edit Assignment</h2>
                      <button
                        onClick={() => {
                          setShowEditForm(false);
                          setEditingAssignment(null);
                          resetForm();
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Course:</strong> {editingAssignment.course_title}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assignment Title *
                        </label>
                        <input
                          type="text"
                          value={assignmentTitle}
                          onChange={(e) => setAssignmentTitle(e.target.value)}
                          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Project 1: Web Development"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={assignmentDescription}
                          onChange={(e) => setAssignmentDescription(e.target.value)}
                          rows={3}
                          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Assignment description..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Number of Teams *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={numTeams}
                            onChange={(e) => setNumTeams(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {numTeams < editingAssignment.num_teams && (
                            <p className="text-xs text-orange-600 mt-1">
                              ⚠️ Reducing teams will delete empty teams
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Members per Team *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={maxMembers}
                            onChange={(e) => setMaxMembers(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assignment Due Date
                          </label>
                          <input
                            type="datetime-local"
                            value={assignmentDueDate}
                            onChange={(e) => setAssignmentDueDate(e.target.value)}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">When students must submit</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Grading Due Date
                          </label>
                          <input
                            type="datetime-local"
                            value={gradingDueDate}
                            onChange={(e) => setGradingDueDate(e.target.value)}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">Your deadline to complete grading</p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleUpdateAssignment}
                          disabled={isUpdating}
                          className="flex-1 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                        >
                          {isUpdating ? "Updating..." : "Update Assignment"}
                        </button>
                        <button
                          onClick={() => {
                            setShowEditForm(false);
                            setEditingAssignment(null);
                            resetForm();
                          }}
                          disabled={isUpdating}
                          className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assignments List */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold mb-4">My Assignments</h2>
                  {assignments.length === 0 ? (
                    <p className="text-gray-500">No assignments created yet</p>
                  ) : (
                    <div className="space-y-4">
                      {assignments.map((assignment) => (
                        <div key={assignment.id} className="border rounded-lg p-4 hover:shadow-md transition">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-blue-600">{assignment.title}</h3>
                              <p className="text-sm text-gray-500 mb-2">{assignment.course_title}</p>
                              {assignment.description && (
                                <p className="text-gray-600 text-sm mb-3">{assignment.description}</p>
                              )}
                              
                              {/* Due Dates Display */}
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="bg-blue-50 rounded p-2">
                                  <p className="text-xs text-gray-600 font-medium">Assignment Due</p>
                                  <p className={`text-sm font-semibold ${
                                    isOverdue(assignment.assignment_due_date) ? "text-red-600" : "text-blue-700"
                                  }`}>
                                    {formatDateTime(assignment.assignment_due_date)}
                                    {isOverdue(assignment.assignment_due_date) && assignment.assignment_due_date && (
                                      <span className="ml-2 text-xs">(Overdue)</span>
                                    )}
                                  </p>
                                </div>
                                
                                <div className="bg-purple-50 rounded p-2">
                                  <p className="text-xs text-gray-600 font-medium">Grading Due</p>
                                  <p className={`text-sm font-semibold ${
                                    isOverdue(assignment.grading_due_date) ? "text-red-600" : "text-purple-700"
                                  }`}>
                                    {formatDateTime(assignment.grading_due_date)}
                                    {isOverdue(assignment.grading_due_date) && assignment.grading_due_date && (
                                      <span className="ml-2 text-xs">(Overdue)</span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-4 text-sm text-gray-600">
                                <span>Teams: {assignment.teams_created}/{assignment.num_teams}</span>
                                <span>Max per team: {assignment.max_members_per_team}</span>
                                <span className="text-gray-400">
                                  Created: {new Date(assignment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 flex gap-2">
                              <button
                                onClick={() => handleEditAssignment(assignment)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm whitespace-nowrap"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleViewTeams(assignment.id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm whitespace-nowrap"
                              >
                                View Teams
                              </button>
                              <button
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-blue-700 text-sm whitespace-nowrap"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
