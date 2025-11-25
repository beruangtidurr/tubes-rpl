import AssignmentCard from "./assignmentCard";

export default function AssignmentContainer(){
  return (
    <div className="flex flex-col">
      <AssignmentCard assignmentDate="10" assignmentNum={1} assignmentDesc="HelloWorld"/>
      <AssignmentCard assignmentDate="10" assignmentNum={1} assignmentDesc="HelloWorld"/>
      <AssignmentCard assignmentDate="10" assignmentNum={1} assignmentDesc="HelloWorld"/>
      <AssignmentCard assignmentDate="10" assignmentNum={1} assignmentDesc="HelloWorld"/>
      <AssignmentCard assignmentDate="10" assignmentNum={1} assignmentDesc="HelloWorld"/>
    </div>
  )
}
