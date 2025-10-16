import { useRef } from 'react'

import { mobileOrderURL } from '@/utils/constants'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'


const MobileOrderLink = () => {
  const mobileOrderRef = useRef(null)
  const animateMobileOrder = useGSAP().contextSafe(() => {
    gsap.fromTo(mobileOrderRef.current, { borderColor: "#f97316" }, { borderColor: "#9333ea", repeat: -1, yoyo: true,yoyoEase:"", duration: 2 })
  })

  useGSAP(() => {
    animateMobileOrder()
  }, [])
  return (
    <>
      <a href={mobileOrderURL} ref={mobileOrderRef} className="border-2 from-orange-500 via-pink-500 to-purple-600 font-bold text-2xl bg-gradient-to-r hover:underline p-4 text-white rounded-full text-center">モバイルオーダーはこちら</a>
      <img src="https://codemates123.github.io/homepage/images/gakusai_poster.webp" alt="" />
    </>
  )
}

export default MobileOrderLink