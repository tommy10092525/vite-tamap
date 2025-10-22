import { useEffect, useState } from "react"

export default function useUserId(){
  const [userId,setUserId]=useState(crypto.randomUUID().toString())  
  useEffect(()=>{
    const userId=localStorage.getItem("userId")
    if(userId){
      setUserId(userId)
    }else{
      const createdUserId=crypto.randomUUID()
      localStorage.setItem("userId",createdUserId)
      setUserId(createdUserId)
    }
  },[])
  return {userId}
}