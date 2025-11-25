interface AssignmentCardProps{
  assignmentNum : number;
  assignmentDate : string;
  assignmentDesc : string;
}

export default function AssignmentCard({assignmentNum, assignmentDate, assignmentDesc} : AssignmentCardProps){
  return (
    <div className="bg-white text-black border-2 p-2 rounded-xl border-white shadow-md border-l-blue-400 border-l-4 m-4">
        <h1 className="font-bold">Assignment {assignmentNum}</h1>
        <p className="text-sm">Due Date: {assignmentDate}</p>
        <p className="text-sm">{assignmentDesc}</p>
    </div>
  )
}
