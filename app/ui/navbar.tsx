import Link from "next/link"

export default function Navbar() {
  return (
    <header className="flex items-center justify-between p-3 bg-white shadow-md text-sm text-gray-700 h-12">
      <div className="font-bold text-lg text-blue-800">TubesRPL</div>
      <nav className="flex space-x-6 items-center">
        <Link href="/" className="hover:text-blue-500">
          Home
        </Link>
        <Link href="/myteam" className="hover:text-blue-500">
          My Team
        </Link>
        <Link href="/grade" className="hover:text-blue-500">
          Grade
        </Link>
      </nav>
      <Link href="/profile" className="flex items-center space-x-2 hover:opacity-80 cursor-pointer">
        <span className="text-gray-600">My Profile</span>
        <div className="h-6 w-6 rounded-full bg-gray-400"></div>
      </Link>
    </header>
  )
}
