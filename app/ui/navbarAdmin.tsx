import Link from "next/link"

export default function Navbar() {
  return (
    <header className="flex items-center justify-between p-3 bg-white shadow-md text-sm text-gray-700 h-12">
      <div className="font-bold text-lg text-blue-800">NamaWeb</div>
      <nav className="flex space-x-6 items-center">
        
        
      </nav>
      <div className="flex items-center space-x-2">
        <span className="text-gray-600">6182301001</span>
        <div className="h-6 w-6 rounded-full bg-gray-400"></div>
      </div>
    </header>
  )
}
