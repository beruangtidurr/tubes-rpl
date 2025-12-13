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

interface TeamMember {
  id: number;
  name: string;
}

interface Team {
  id: number;
  name: string;
  members: TeamMember[];
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  assignmentDueDate: string;
  gradingDueDate: string;
  academicYear?: string;
  semester?: string;
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
  currentAcademicYear?: string;
  currentSemester?: string;
  filterAcademicYear?: string;
  filterSemester?: string;
  availableAcademicYears?: string[];
}

export default function StudentGradeView() {
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set());
  const [expandedAssignments, setExpandedAssignments] = useState<Set<number>>(new Set());
  const [gradeData, setGradeData] = useState<GradeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<'GANJIL' | 'GENAP' | ''>('');

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        // Build query string with filters
        const params = new URLSearchParams();
        if (selectedAcademicYear) {
          params.append('academicYear', selectedAcademicYear);
        }
        if (selectedSemester) {
          params.append('semester', selectedSemester);
        }

        const url = `/api/student/grades${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch grades');
        }
        const data = await response.json();
        setGradeData(data);
        
        // Set initial values if not set
        if (!selectedAcademicYear && data.currentAcademicYear) {
          setSelectedAcademicYear(data.currentAcademicYear);
        }
        if (!selectedSemester && data.currentSemester) {
          setSelectedSemester(data.currentSemester);
        }
      } catch (error) {
        console.error('Error fetching grades:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [selectedAcademicYear, selectedSemester]);

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
        <p className="text-gray-600 mb-4">View your grades across all courses and assignments</p>
        
        {/* Filter Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tahun Akademik
              </label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Tahun Akademik</option>
                {gradeData?.availableAcademicYears?.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as 'GANJIL' | 'GENAP' | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Semester</option>
                <option value="GANJIL">Ganjil</option>
                <option value="GENAP">Genap</option>
              </select>
            </div>
            <div className="flex-1">
              <button
                onClick={() => {
                  if (gradeData?.currentAcademicYear && gradeData?.currentSemester) {
                    setSelectedAcademicYear(gradeData.currentAcademicYear);
                    setSelectedSemester(gradeData.currentSemester as 'GANJIL' | 'GENAP');
                  }
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Reset ke Semester Saat Ini
              </button>
            </div>
          </div>
          {gradeData?.filterAcademicYear && gradeData?.filterSemester && (
            <div className="mt-3 text-sm text-gray-600">
              Menampilkan nilai untuk: <span className="font-semibold">{gradeData.filterAcademicYear} - {gradeData.filterSemester}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 overflow-y-auto">
        {gradeData?.courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg  overflow-hidden">
            {/* Course Header */}
            <div
              className="bg-grey-300 hover:bg-grey-400 text-black p-4 cursor-pointer transition-all shadow-md"
              onClick={() => toggleCourse(course.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">
                    {expandedCourses.has(course.id) ? '▼' : '▶'}
                  </span>
                  <span className="text-xl">📘</span>

                  <div className='text-black'>
                    <h3 className="text-xl font-semibold">{course.title}</h3>
                    <p className=" text-sm">{course.description}</p>
                  </div>
                </div>
                <div className="text-sm text-black">{course.assignments.length} assignment(s)</div>
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
                                {assignment.team && assignment.team.id && (
                                  <div className="flex items-center space-x-1">
                                    <span>👥</span>
                                    <span>{assignment.team.name}</span>
                                  </div>
                                )}
                                {assignment.assignmentDueDate && (
                                  <div>
                                    Due:{' '}
                                    {new Date(
                                      assignment.assignmentDueDate
                                    ).toLocaleDateString()}
                                  </div>
                                )}
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
                          {assignment.team && assignment.team.id && assignment.team.members && assignment.team.members.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <h5 className="font-semibold text-blue-900 mb-2 flex items-center">
                                <span className="mr-2">👥</span> Team Members
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {assignment.team.members.map((member) => (
                                  <span
                                    key={member.id}
                                    className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 border border-blue-200"
                                  >
                                    {member.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

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
