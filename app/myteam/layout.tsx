interface LayoutProps{
  children : React.ReactNode;
}

export default function LayoutMyTeam({children} : LayoutProps){
  return (
    <div>
      {children}
    </div>
  )
}
