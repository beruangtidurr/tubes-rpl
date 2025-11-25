interface ChatCardProps{
  title: string;
  team : number;
}

export default function ChatCard({title, team} : ChatCardProps){
  return(
    <div className="bg-[#ECECEC] shadow-md rounded-xl p-2 mb-4 hover:bg-gray-300 hover:cursor-pointer border-r-4 border-blue-500">
      <h3 className="font-semibold text-md">Course : {title}</h3>
      <h4 className="text-sm">Kelompok : {team}</h4>
    </div>
  )
}
