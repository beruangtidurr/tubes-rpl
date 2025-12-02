'use client';

import React, { useState, useEffect } from 'react';

interface GradeComponent {
  id: number;
  name: string;
  description: string;
  maxScore: number;
  weight: number;
  teamScore: number | null;
  individualScore: number | null;
  notes: string | null;
}

interface Team {
  id: number;
  name: string;
  members: string[];
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  assignmentDueDate: string;
  gradingDueDate: string;
  team: Team;
  gradeComponents: GradeComponent[];
  overallFeedback: string | null;
  finalGrade: number | null;
}

interface Course {
  id: number;
  title: string;
  description: string;
  assignments: Assignment[];
}

interface GradeData {
  courses: Course[];
}

export default function StudentGradeView() {
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set());
  const [expandedAssignments, setExpandedAssignments] = useState<Set<number>>(new Set());
  const [gradeData, setGradeData] = useState<GradeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await fetch('/api/student/grades');
        if (!response.ok) {
          throw new Error('Failed to fetch grades');
        }
        const data = await response.json();
        setGradeData(data);
      } catch (error) {
        console.error('Error fetching grades:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  const toggleCourse = (courseId: number) => {
    const newExpanded = new Set(expandedCourses);
    newExpanded.has(courseId) ? newExpanded.delete(courseId) : newExpanded.add(courseId);
    setExpandedCourses(newExpanded);
  };

  const toggleAssignment = (assignmentId: number) => {
    const newExpanded = new Set(expandedAssignments);
    newExpanded.has(assignmentId) ? newExpanded.delete(assignmentId) : newExpanded.add(assignmentId);
    setExpandedAssignments(newExpanded);
  };

  const calculateFinalGrade = (components: GradeComponent[]) => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    components.forEach((comp) => {
      const score = comp.individualScore ?? comp.teamScore;
      if (score !== null) {
        totalWeightedScore += score * comp.weight;
        totalWeight += comp.weight;
      }
    });

    return totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(2) : null;
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 80) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (score >= 60) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  if (loading) {
    return (
      <div className="flex flex-col grow justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="mt-4 text-gray-600">Loading grades...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col grow font-sans p-4">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">My Grades</h2>
        <p className="text-gray-600">View your grades across all courses and assignments</p>
      </div>

      <div className="space-y-4 overflow-y-auto">
        {gradeData?.courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Course Header */}
            <div
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all"
              onClick={() => toggleCourse(course.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">
                    {expandedCourses.has(course.id) ? '▼' : '▶'}
                  </span>
                  <span className="text-xl">📘</span>

                  <div>
                    <h3 className="text-xl font-semibold">{course.title}</h3>
                    <p className="text-blue-100 text-sm">{course.description}</p>
                  </div>
                </div>
                <div className="text-sm">{course.assignments.length} assignment(s)</div>
              </div>
            </div>

            {/* Course Content */}
            {expandedCourses.has(course.id) && (
              <div className="p-4 space-y-3">
                {course.assignments.map((assignment) => {
                  const finalGrade =
                    assignment.finalGrade ??
                    calculateFinalGrade(assignment.gradeComponents);

                  const isGraded = finalGrade !== null;

                  return (
                    <div key={assignment.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Assignment Header */}
                      <div
                        className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleAssignment(assignment.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <span className="text-lg mt-1 text-gray-600">
                              {expandedAssignments.has(assignment.id) ? '▼' : '▶'}
                            </span>

                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-800 mb-1">
                                {assignment.title}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">
                                {assignment.description}
                              </p>

                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <span>👥</span>
                                  <span>{assignment.team.name}</span>
                                </div>
                                <div>
                                  Due:{' '}
                                  {new Date(
                                    assignment.assignmentDueDate
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="ml-4">
                            {isGraded ? (
                              <div
                                className={`px-4 py-2 rounded-lg border-2 font-bold text-2xl ${getGradeBadgeColor(
                                  parseFloat(String(finalGrade))
                                )}`}
                              >
                                {finalGrade}
                              </div>
                            ) : (
                              <div className="px-4 py-2 rounded-lg border-2 border-gray-300 bg-gray-100 text-gray-500 font-semibold">
                                Not Graded
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Assignment Details */}
                      {expandedAssignments.has(assignment.id) && (
                        <div className="p-4 bg-white space-y-4">
                          {/* Team Members */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <h5 className="font-semibold text-blue-900 mb-2 flex items-center">
                              <span className="mr-2">👥</span> Team Members
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {assignment.team.members.map((member, idx) => (
                                <span
                                  key={idx}
                                  className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 border border-blue-200"
                                >
                                  {member}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Grade Components */}
                          <div>
                            <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                              <span className="mr-2">📝</span> Grade Breakdown
                            </h5>

                            <div className="space-y-3">
                              {assignment.gradeComponents.map((component) => {
                                const displayScore =
                                  component.individualScore ?? component.teamScore;

                                const hasIndividualScore =
                                  component.individualScore !== null;

                                return (
                                  <div key={component.id} className="border border-gray-200 rounded-lg p-3">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <h6 className="font-semibold text-gray-800">
                                            {component.name}
                                          </h6>
                                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                            {component.weight}% weight
                                          </span>
                                          {hasIndividualScore && (
                                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                              Individual
                                            </span>
                                          )}
                                        </div>

                                        <p className="text-sm text-gray-600 mt-1">
                                          {component.description}
                                        </p>
                                      </div>

                                      <div className="text-right ml-4">
                                        {displayScore !== null ? (
                                          <>
                                            <div
                                              className={`text-2xl font-bold ${getGradeColor(
                                                displayScore
                                              )}`}
                                            >
                                              {displayScore}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              / {component.maxScore}
                                            </div>
                                          </>
                                        ) : (
                                          <div className="text-sm text-gray-400 italic">
                                            Not graded
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Show both if different */}
                                    {hasIndividualScore && component.teamScore !== null && (
                                      <div className="mt-2 pt-2 border-t border-gray-200 text-sm">
                                        <span className="text-gray-600">Team score: </span>
                                        <span className="font-semibold">
                                          {component.teamScore}
                                        </span>
                                      </div>
                                    )}

                                    {component.notes && (
                                      <div className="mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-sm text-gray-700">
                                          <span className="font-semibold">Feedback: </span>
                                          {component.notes}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Overall Feedback */}
                          {assignment.overallFeedback && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <h5 className="font-semibold text-green-900 mb-2 flex items-center">
                                <span className="mr-2">🏆</span> Overall Feedback
                              </h5>
                              <p className="text-gray-700">
                                {assignment.overallFeedback}
                              </p>
                            </div>
                          )}

                          {/* Final Grade */}
                          {isGraded && (
                            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-800">
                                  Final Grade:
                                </span>
                                <span
                                  className={`text-3xl font-bold ${getGradeColor(
                                    parseFloat(String(finalGrade))
                                  )}`}
                                >
                                  {finalGrade} / 100
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {course.assignments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No assignments yet for this course
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {gradeData?.courses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📘</div>
            <p className="text-gray-600 text-lg">No enrolled courses yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
