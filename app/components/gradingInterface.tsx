"use client";

import { useState, useEffect } from "react";

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
  members: TeamMember[];
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

export default function GradingInterface({ 
  assignmentId, 
  assignmentTitle, 
  teams, 
  onBack 
}: GradingInterfaceProps) {
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
  const [isSaving, setSaving] = useState(false);

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
      const data = await res.json();
      setComponents(data.components || []);
    } catch (error) {
      console.error("Error fetching components:", error);
    }
  };

  const fetchTeamGrades = async () => {
    if (!selectedTeam) return;
    
    try {
      const res = await fetch(`/api/lecturer/teams/${selectedTeam.id}/grades`);
      const data = await res.json();
      
      // Load existing team grades
      const teamGrade = data.teamGrades?.find((g: any) => g.component_id === selectedComponent?.id);
      if (teamGrade) {
        setTeamScore(teamGrade.score);
        setTeamNotes(teamGrade.notes || "");
      } else {
        setTeamScore(0);
        setTeamNotes("");
      }
      
      // Load existing individual grades
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
      
      // Load overall feedback
      if (data.feedback) {
        setOverallFeedback(data.feedback.overall_notes || "");
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
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

    setSaving(true);
    
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
        // Individual grading mode
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
      setSaving(false);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Assignment
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
          
          {/* Component Selection */}
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
              {/* Grading Mode Toggle */}
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

              {/* Team Grading */}
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

              {/* Individual Grading */}
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

              {/* Overall Feedback */}
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
