// app/lecturer/page.tsx

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

// Grading Interface Types
type GradeComponent = {
  id: number;
  assignment_id: number;
  name: string;
  description: string | null;
  max_score: number;
  weight: number;
  rubric: string | null;
  component_order: number;
};

type IndividualGrade = {
  teamMemberId: number;
  componentId: number;
  score: number;
  notes: string;
};

type GradingInterfaceProps = {
  assignmentId: number;
  assignmentTitle: string;
  teams: Team[];
  onBack: () => void;
};

function GradingInterface({ assignmentId, assignmentTitle, teams, onBack }: GradingInterfaceProps) {
  const [components, setComponents] = useState<GradeComponent[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showComponentForm, setShowComponentForm] = useState(false);
  const [gradingMode, setGradingMode] = useState<"team" | "individual">("team");
  
  // Component form state
  const [componentName, setComponentName] = useState("");
  const [componentDesc, setComponentDesc] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [weight, setWeight] = useState(0);
  const [rubric, setRubric] = useState("");
  
  // Grading state
  const [teamScore, setTeamScore] = useState<number>(0);
  const [teamNotes, setTeamNotes] = useState("");
  const [selectedComponent, setSelectedComponent] = useState<GradeComponent | null>(null);
  const [individualGrades, setIndividualGrades] = useState<Record<number, { score: number; notes: string }>>({});
  const [overallFeedback, setOverallFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Store all team grades for calculation
  const [allTeamGrades, setAllTeamGrades] = useState<Record<number, any>>({});

  useEffect(() => {
    fetchComponents();
  }, [assignmentId]);

  useEffect(() => {
    if (selectedTeam && selectedComponent) {
      fetchTeamGrades();
    }
  }, [selectedTeam, selectedComponent]);

  const fetchComponents = async () => {
    try {
      const res = await fetch(`/api/lecturer/assignments/${assignmentId}/components`);
      console.log("Components response status:", res.status);
      console.log("Components response headers:", res.headers.get('content-type'));
      
      const text = await res.text();
      console.log("Components raw response:", text.substring(0, 200));
      
      const data = JSON.parse(text);
      setComponents(data.components || []);
    } catch (error) {
      console.error("Error fetching components:", error);
      alert(`Failed to load components. Check console for details.`);
    }
  };

  const fetchTeamGrades = async () => {
    if (!selectedTeam) return;
    
    try {
      const res = await fetch(`/api/lecturer/teams/${selectedTeam.id}/grades`);
      console.log("Grades response status:", res.status);
      console.log("Grades response headers:", res.headers.get('content-type'));
      
      const text = await res.text();
      console.log("Grades raw response:", text.substring(0, 200));
      
      const data = JSON.parse(text);
      
      const teamGrade = data.teamGrades?.find((g: any) => g.component_id === selectedComponent?.id);
      if (teamGrade) {
        setTeamScore(teamGrade.score);
        setTeamNotes(teamGrade.notes || "");
      } else {
        setTeamScore(0);
        setTeamNotes("");
      }
      
      const individualGradeData: Record<number, { score: number; notes: string }> = {};
      data.studentGrades?.forEach((g: any) => {
        if (g.component_id === selectedComponent?.id) {
          individualGradeData[g.team_member_id] = {
            score: g.score,
            notes: g.notes || ""
          };
        }
      });
      setIndividualGrades(individualGradeData);
      
      if (data.feedback) {
        setOverallFeedback(data.feedback.overall_notes || "");
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
      alert(`Failed to load grades. Check console for details.`);
    }
  };

  const handleCreateComponent = async () => {
    if (!componentName || maxScore <= 0 || weight < 0) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch(`/api/lecturer/assignments/${assignmentId}/components`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: componentName,
          description: componentDesc,
          maxScore: maxScore,
          weight: weight,
          rubric: rubric,
          componentOrder: components.length + 1
        }),
      });

      if (res.ok) {
        alert("Grade component created successfully!");
        setShowComponentForm(false);
        resetComponentForm();
        fetchComponents();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create component");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const handleSaveGrades = async () => {
    if (!selectedTeam || !selectedComponent) return;

    setIsSaving(true);
    
    try {
      const payload: any = {
        overallFeedback: overallFeedback
      };

      if (gradingMode === "team") {
        payload.applyToAll = true;
        payload.componentId = selectedComponent.id;
        payload.score = teamScore;
        payload.notes = teamNotes;
      } else {
        const grades: IndividualGrade[] = [];
        selectedTeam.members.forEach(member => {
          const grade = individualGrades[member.id];
          if (grade) {
            grades.push({
              teamMemberId: member.id,
              componentId: selectedComponent.id,
              score: grade.score,
              notes: grade.notes
            });
          }
        });
        payload.individualGrades = grades;
      }

      const res = await fetch(`/api/lecturer/teams/${selectedTeam.id}/grades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Grades saved successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save grades");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const resetComponentForm = () => {
    setComponentName("");
    setComponentDesc("");
    setMaxScore(100);
    setWeight(0);
    setRubric("");
  };

  const updateIndividualGrade = (memberId: number, field: "score" | "notes", value: any) => {
    setIndividualGrades(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [field]: value
      }
    }));
  };

  const totalWeight = components.reduce((sum, c) => sum + parseFloat(c.weight.toString()), 0);

  // Calculate total grade based on weighted components
  const calculateTotalGrade = (teamId: number) => {
    const teamGrades = allTeamGrades[teamId];
    
    if (!teamGrades || typeof teamGrades !== 'object') {
      return null;
    }
    
    // Check if it's the selection view data format
    if ('totalGrade' in teamGrades) {
      return teamGrades;
    }
    
    // Otherwise calculate from component grades
    let totalWeightedScore = 0;
    let totalWeight = 0;

    components.forEach((comp) => {
      const grade = teamGrades[comp.id];
      if (grade) {
        const percentageScore = (grade.score / grade.maxScore) * 100;
        const weightedScore = (percentageScore * grade.weight) / 100;
        totalWeightedScore += weightedScore;
        totalWeight += grade.weight;
      }
    });

    if (totalWeight === 0) return null;
    
    return {
      score: totalWeightedScore,
      isComplete: totalWeight === 100,
      gradedWeight: totalWeight
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 mb-2 font-medium"
          >
            ← Back to Assignments
          </button>
          <h2 className="text-2xl font-bold">Grade: {assignmentTitle}</h2>
        </div>
      </div>

      {/* Grade Components Setup */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold">Grade Components</h3>
            <p className="text-sm text-gray-600">
              Total Weight: <span className={totalWeight === 100 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{totalWeight}%</span>
              {totalWeight !== 100 && " (Should equal 100%)"}
            </p>
          </div>
          <button
            onClick={() => setShowComponentForm(!showComponentForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showComponentForm ? "Cancel" : "+ Add Component"}
          </button>
        </div>

        {showComponentForm && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-semibold mb-3">New Grade Component</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Component Name *</label>
                <input
                  type="text"
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Code Quality"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Score *</label>
                <input
                  type="number"
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min="1"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={componentDesc}
                  onChange={(e) => setComponentDesc(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weight (%) *</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rubric</label>
                <textarea
                  value={rubric}
                  onChange={(e) => setRubric(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                  placeholder="Grading criteria..."
                />
              </div>
            </div>
            <button
              onClick={handleCreateComponent}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Component
            </button>
          </div>
        )}

        {components.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No grade components yet. Create one to start grading.</p>
        ) : (
          <div className="space-y-2">
            {components.map((comp) => (
              <div key={comp.id} className="border rounded p-3 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{comp.name}</h4>
                    {comp.description && (
                      <p className="text-sm text-gray-600">{comp.description}</p>
                    )}
                    {comp.rubric && (
                      <p className="text-xs text-gray-500 mt-1">Rubric: {comp.rubric}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{comp.max_score} pts</p>
                    <p className="text-xs text-blue-600">{comp.weight}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Selection */}
      {components.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Select Team to Grade</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className={`p-4 border-2 rounded-lg text-left transition ${
                  selectedTeam?.id === team.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-300"
                }`}
              >
                <p className="font-semibold">{team.name}</p>
                <p className="text-sm text-gray-600">{team.members.length} members</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grading Interface */}
      {selectedTeam && components.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Grade {selectedTeam.name}</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Component to Grade</label>
            <select
              value={selectedComponent?.id || ""}
              onChange={(e) => {
                const comp = components.find(c => c.id === Number(e.target.value));
                setSelectedComponent(comp || null);
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Select Component --</option>
              {components.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name} ({comp.weight}% - Max: {comp.max_score})
                </option>
              ))}
            </select>
          </div>

          {selectedComponent && (
            <>
              <div className="mb-6 flex gap-4 p-3 bg-gray-50 rounded">
                <button
                  onClick={() => setGradingMode("team")}
                  className={`flex-1 py-2 px-4 rounded font-medium ${
                    gradingMode === "team"
                      ? "bg-blue-600 text-white"
                      : "bg-white border hover:bg-gray-100"
                  }`}
                >
                  Same Grade for All Members
                </button>
                <button
                  onClick={() => setGradingMode("individual")}
                  className={`flex-1 py-2 px-4 rounded font-medium ${
                    gradingMode === "individual"
                      ? "bg-blue-600 text-white"
                      : "bg-white border hover:bg-gray-100"
                  }`}
                >
                  Individual Grades
                </button>
              </div>

              {gradingMode === "team" && (
                <div className="space-y-4 mb-6 p-4 border rounded">
                  <h4 className="font-semibold">Team Grade for: {selectedComponent.name}</h4>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Score (Max: {selectedComponent.max_score})
                    </label>
                    <input
                      type="number"
                      value={teamScore}
                      onChange={(e) => setTeamScore(Number(e.target.value))}
                      max={selectedComponent.max_score}
                      min="0"
                      step="0.5"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={teamNotes}
                      onChange={(e) => setTeamNotes(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      rows={3}
                      placeholder="Feedback for this component..."
                    />
                  </div>
                </div>
              )}

              {gradingMode === "individual" && (
                <div className="space-y-4 mb-6">
                  <h4 className="font-semibold">Individual Grades for: {selectedComponent.name}</h4>
                  {selectedTeam.members.map((member) => (
                    <div key={member.id} className="p-4 border rounded bg-gray-50">
                      <h5 className="font-medium mb-3">{member.user_name}</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Score (Max: {selectedComponent.max_score})
                          </label>
                          <input
                            type="number"
                            value={individualGrades[member.id]?.score || 0}
                            onChange={(e) => updateIndividualGrade(member.id, "score", Number(e.target.value))}
                            max={selectedComponent.max_score}
                            min="0"
                            step="0.5"
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Notes</label>
                          <input
                            type="text"
                            value={individualGrades[member.id]?.notes || ""}
                            onChange={(e) => updateIndividualGrade(member.id, "notes", e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            placeholder="Individual feedback..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Overall Team Feedback</label>
                <textarea
                  value={overallFeedback}
                  onChange={(e) => setOverallFeedback(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                  placeholder="General comments about the team's performance..."
                />
              </div>

              <button
                onClick={handleSaveGrades}
                disabled={isSaving}
                className="w-full py-3 bg-green-600 text-white rounded font-semibold hover:bg-green-700 disabled:bg-gray-400"
              >
                {isSaving ? "Saving..." : "Save Grades"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function LecturerPage() {
  const [activeTab, setActiveTab] = useState<"courses" | "assignments">("courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "teams" | "grading">("list");
  const [teamGradesData, setTeamGradesData] = useState<Record<number, any>>({});
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<number | null>(null);

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

  // Team member management state
  const [students, setStudents] = useState<Array<{id: number; name: string; email: string; current_team_id: number | null; current_team_name: string | null}>>([]);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedTeamForAdd, setSelectedTeamForAdd] = useState<number | null>(null);
  const [isManagingTeam, setIsManagingTeam] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment && viewMode === "teams") {
      fetchStudentsForAssignment();
    }
  }, [selectedAssignment, viewMode]);

  useEffect(() => {
    if (selectedAssignment) {
      fetchTeams(selectedAssignment);
    }
  }, [selectedAssignment]);

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
      
      // Fetch grades for all teams
      if (data.teams && data.teams.length > 0) {
        await fetchAllTeamGrades(assignmentId, data.teams);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const fetchStudentsForAssignment = async () => {
    if (!selectedAssignment) return;
    
    try {
      const res = await fetch(`/api/lecturer/assignments/${selectedAssignment}/students`);
      const data = await res.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleAddStudentToTeam = async (teamId: number, userId: number, userName: string) => {
    setIsManagingTeam(true);
    try {
      const res = await fetch(`/api/lecturer/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userName }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to add student to team");
        return;
      }

      // Refresh teams and students
      if (selectedAssignment) {
        await fetchTeams(selectedAssignment);
        await fetchStudentsForAssignment();
      }
      setShowAddStudentModal(false);
      setSelectedTeamForAdd(null);
    } catch (error) {
      console.error("Error adding student to team:", error);
      alert("Network error. Please try again.");
    } finally {
      setIsManagingTeam(false);
    }
  };

  const handleRemoveStudentFromTeam = async (teamId: number, userId: number) => {
    if (!confirm("Are you sure you want to remove this student from the team?")) {
      return;
    }

    setIsManagingTeam(true);
    try {
      const res = await fetch(`/api/lecturer/teams/${teamId}/members?userId=${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to remove student from team");
        return;
      }

      // Refresh teams and students
      if (selectedAssignment) {
        await fetchTeams(selectedAssignment);
        await fetchStudentsForAssignment();
      }
    } catch (error) {
      console.error("Error removing student from team:", error);
      alert("Network error. Please try again.");
    } finally {
      setIsManagingTeam(false);
    }
  };

  const handleMoveStudentToTeam = async (fromTeamId: number, toTeamId: number, userId: number, userName: string) => {
    setIsManagingTeam(true);
    try {
      // Remove from old team
      const removeRes = await fetch(`/api/lecturer/teams/${fromTeamId}/members?userId=${userId}`, {
        method: "DELETE",
      });

      if (!removeRes.ok) {
        const removeData = await removeRes.json();
        alert(removeData.error || "Failed to remove student from previous team");
        return;
      }

      // Add to new team
      const addRes = await fetch(`/api/lecturer/teams/${toTeamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userName }),
      });

      const addData = await addRes.json();

      if (!addRes.ok) {
        alert(addData.error || "Failed to add student to new team");
        return;
      }

      // Refresh teams and students
      if (selectedAssignment) {
        await fetchTeams(selectedAssignment);
        await fetchStudentsForAssignment();
      }
      setShowAddStudentModal(false);
      setSelectedTeamForAdd(null);
    } catch (error) {
      console.error("Error moving student:", error);
      alert("Network error. Please try again.");
    } finally {
      setIsManagingTeam(false);
    }
  };

  const fetchAllTeamGrades = async (assignmentId: number, teamsList: Team[]) => {
    try {
      // Fetch components for this assignment
      const compRes = await fetch(`/api/lecturer/assignments/${assignmentId}/components`);
      const compData = await compRes.json();
      const components = compData.components || [];

      console.log("Components for assignment:", components);

      if (components.length === 0) {
        console.log("No components found for this assignment");
        return;
      }

      // Fetch grades for each team
      const gradesPromises = teamsList.map(async (team) => {
        try {
          const gradeRes = await fetch(`/api/lecturer/teams/${team.id}/grades`);
          const gradeData = await gradeRes.json();
          
          console.log(`Team ${team.name} (ID: ${team.id}) grades:`, gradeData);
          
          // Calculate total grade
          let totalWeightedScore = 0;
          let totalWeight = 0;

          gradeData.teamGrades?.forEach((grade: any) => {
            const comp = components.find((c: any) => c.id === grade.component_id);
            if (comp) {
              const percentageScore = (grade.score / comp.max_score) * 100;
              const compWeight = parseFloat(comp.weight.toString());
              const weightedScore = (percentageScore * compWeight) / 100;
              totalWeightedScore += weightedScore;
              totalWeight += compWeight;
              console.log(`  Component ${comp.name}: ${grade.score}/${comp.max_score} (${percentageScore.toFixed(1)}%) × ${compWeight}% = ${weightedScore.toFixed(2)}`);
            }
          });

          console.log(`  Total for ${team.name}: ${totalWeightedScore.toFixed(1)}% (${totalWeight}% of components graded)`);

          return {
            teamId: team.id,
            totalGrade: totalWeight > 0 ? totalWeightedScore : null,
            isComplete: totalWeight === 100,
            gradedWeight: totalWeight
          };
        } catch (err) {
          console.error(`Error fetching grades for team ${team.id}:`, err);
          return { teamId: team.id, totalGrade: null, isComplete: false, gradedWeight: 0 };
        }
      });

      const gradesResults = await Promise.all(gradesPromises);
      const gradesMap: Record<number, any> = {};
      gradesResults.forEach(result => {
        gradesMap[result.teamId] = result;
      });
      
      console.log("Final calculated grades map:", gradesMap);
      setTeamGradesData(gradesMap);
    } catch (error) {
      console.error("Error fetching team grades:", error);
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
    setViewMode("teams");
  };

  const handleStartGrading = (assignmentId: number) => {
    setSelectedAssignment(assignmentId);
    setViewMode("grading");
  };

  const handleBackToAssignments = () => {
    setSelectedAssignment(null);
    setTeams([]);
    setViewMode("list");
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
            onClick={() => {
              setActiveTab("assignments");
              // Don't reset filter when clicking tab - only reset when explicitly clearing
            }}
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
                    <div 
                      key={course.id} 
                      onClick={() => {
                        setSelectedCourseFilter(course.id);
                        setActiveTab("assignments");
                      }}
                      className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                    >
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
            {/* Grading Interface */}
            {selectedAssignment && viewMode === "grading" ? (
              <GradingInterface
                assignmentId={selectedAssignment}
                assignmentTitle={assignments.find(a => a.id === selectedAssignment)?.title || ""}
                teams={teams}
                onBack={handleBackToAssignments}
              />
            ) : selectedAssignment && viewMode === "teams" ? (
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
                    {teams.map((team) => {
                      const gradeInfo = teamGradesData[team.id];
                      
                      return (
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

                          {gradeInfo && gradeInfo.totalGrade !== null ? (
                            <div className={`mb-3 p-3 rounded ${
                              gradeInfo.isComplete ? "bg-green-50 border border-green-200" : "bg-orange-50 border border-orange-200"
                            }`}>
                              <p className="text-xs text-gray-600 font-medium">Total Grade:</p>
                              <p className={`text-2xl font-bold ${
                                gradeInfo.isComplete ? "text-green-700" : "text-orange-600"
                              }`}>
                                {gradeInfo.totalGrade.toFixed(1)}%
                              </p>
                              {!gradeInfo.isComplete && (
                                <p className="text-xs text-orange-600 mt-1">
                                  {gradeInfo.gradedWeight}% of components graded
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="mb-3 p-3 bg-gray-100 rounded border border-gray-300">
                              <p className="text-xs text-gray-500 text-center">Not graded yet</p>
                            </div>
                          )}

                          <div className="space-y-2 mb-3">
                            {team.members.length === 0 ? (
                              <p className="text-sm text-gray-500 italic">No members yet</p>
                            ) : (
                              team.members.map((member) => (
                                <div key={member.id} className="bg-white rounded p-2 text-sm border flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">{member.user_name}</p>
                                    <p className="text-xs text-gray-500">
                                      Joined: {new Date(member.joined_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveStudentFromTeam(team.id, member.user_id)}
                                    disabled={isManagingTeam}
                                    className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                                    title="Remove from team"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                          
                          {/* Add Student Button */}
                          {team.current_members < team.max_members && (
                            <button
                              onClick={() => {
                                setSelectedTeamForAdd(team.id);
                                setShowAddStudentModal(true);
                              }}
                              disabled={isManagingTeam}
                              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              + Add Student
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Student Modal */}
                {showAddStudentModal && selectedTeamForAdd && (
                  <div 
                    className="fixed inset-0 bg-gradient-to-br from-gray-900/40 via-gray-800/30 to-gray-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity duration-200"
                    onClick={(e) => {
                      // Close modal when clicking on backdrop
                      if (e.target === e.currentTarget) {
                        setShowAddStudentModal(false);
                        setSelectedTeamForAdd(null);
                      }
                    }}
                  >
                    <div 
                      className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-200 scale-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">Add Student to Team</h3>
                          <p className="text-sm text-gray-500">
                            Select a student to add to <span className="font-semibold text-blue-600">{teams.find(t => t.id === selectedTeamForAdd)?.name}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setShowAddStudentModal(false);
                            setSelectedTeamForAdd(null);
                          }}
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
                          title="Close"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                        {students.filter(s => {
                          // Show students who are not in any team, or are in a different team
                          return !s.current_team_id || s.current_team_id !== selectedTeamForAdd;
                        }).length === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            </div>
                            <p className="text-gray-500 font-medium">No available students</p>
                            <p className="text-gray-400 text-sm mt-1">All students are already assigned to teams</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {students
                              .filter(s => {
                                // Show students who are not in any team, or are in a different team
                                return !s.current_team_id || s.current_team_id !== selectedTeamForAdd;
                              })
                              .map((student) => (
                                <div
                                  key={student.id}
                                  className="group border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:border-blue-300 hover:shadow-md bg-white transition-all duration-200"
                                >
                                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                      {student.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-gray-900 truncate">{student.name}</p>
                                      <p className="text-xs text-gray-500 mt-0.5 truncate">{student.email}</p>
                                      {student.current_team_name && (
                                        <div className="mt-2 flex items-center space-x-1">
                                          <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                          </svg>
                                          <p className="text-xs text-orange-600 font-medium">
                                            Currently in <span className="font-bold">{student.current_team_name}</span>
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (student.current_team_id && student.current_team_id !== selectedTeamForAdd) {
                                        // Move from one team to another
                                        handleMoveStudentToTeam(
                                          student.current_team_id,
                                          selectedTeamForAdd!,
                                          student.id,
                                          student.name
                                        );
                                      } else {
                                        // Just add to team
                                        handleAddStudentToTeam(
                                          selectedTeamForAdd!,
                                          student.id,
                                          student.name
                                        );
                                      }
                                    }}
                                    disabled={isManagingTeam}
                                    className={`ml-4 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                                      student.current_team_id && student.current_team_id !== selectedTeamForAdd
                                        ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg"
                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md`}
                                  >
                                    {isManagingTeam ? (
                                      <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                      </span>
                                    ) : (
                                      student.current_team_id && student.current_team_id !== selectedTeamForAdd
                                        ? "Move Here"
                                        : "Add to Team"
                                    )}
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
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
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">My Assignments</h2>
                    {selectedCourseFilter && (
                      <button
                        onClick={() => setSelectedCourseFilter(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                      >
                        Clear Filter (Show All)
                      </button>
                    )}
                  </div>
                  {selectedCourseFilter && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm text-blue-800">
                        Showing assignments for: <strong>{courses.find(c => c.id === selectedCourseFilter)?.title}</strong>
                      </p>
                    </div>
                  )}
                  {(() => {
                    let filteredAssignments = assignments;
                    
                    if (selectedCourseFilter) {
                      const selectedCourse = courses.find(c => Number(c.id) === Number(selectedCourseFilter));
                      if (selectedCourse) {
                        // Filter by course_id (ensure both are numbers) or course_title (string comparison) as fallback
                        filteredAssignments = assignments.filter(a => {
                          const courseIdMatch = Number(a.course_id) === Number(selectedCourseFilter);
                          const courseTitleMatch = a.course_title && selectedCourse.title && 
                            a.course_title.toLowerCase().trim() === selectedCourse.title.toLowerCase().trim();
                          return courseIdMatch || courseTitleMatch;
                        });
                      } else {
                        // If course not found, show all assignments
                        filteredAssignments = assignments;
                      }
                    }
                    
                    if (filteredAssignments.length === 0) {
                      return (
                        <p className="text-gray-500">
                          {selectedCourseFilter 
                            ? "No assignments found for this course" 
                            : "No assignments created yet"}
                        </p>
                      );
                    }
                    
                    return (
                      <div className="space-y-4">
                        {filteredAssignments.map((assignment) => (
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
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm whitespace-nowrap"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleStartGrading(assignment.id)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm whitespace-nowrap"
                              >
                                Grade
                              </button>
                              <button
                                onClick={() => handleViewTeams(assignment.id)}
                                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm whitespace-nowrap"
                              >
                                View Teams
                              </button>
                              <button
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm whitespace-nowrap"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
