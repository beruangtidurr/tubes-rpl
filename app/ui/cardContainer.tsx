import CourseCard from "./courseCard"

export default function CardContainer(){
  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
           <CourseCard title="Artificial Intelligence" desc="-"/>
           <CourseCard title="Manajemen Proyek" desc="-"/>
           <CourseCard title="Pengantar Sistem Informasi" desc="-"/>
           <CourseCard title="Pemrograman Berbasis Web" desc="-"/>
           <CourseCard title="Desain Antar Grafis" desc="-"/>
    </div>
  )
}
