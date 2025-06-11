import React from 'react'
type CardProps={children:React.ReactNode,className?:string}
const card = ({children,className}:CardProps) => {
  return (
    <div className={`
      bg-white/20 border border-t-white/60 border-l-white/60 border-b-white/30 border-r-white/30 dark:bg-black/30 dark:bg-opacity-30 dark:border-t-white/30 dark:border-l-white/30 dark:border-b-white/30 dark:border-r-white/30
      shadow-lg p-2 rounded-2xl ${className}`}>
      {children}
    </div>
  )
}

export default card
