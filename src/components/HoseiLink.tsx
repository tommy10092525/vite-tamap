import HoseiLinkImage from "@/images/Stylized Interlocked 'H' and 'L' Icon.png"
import { Card, CardContent, CardHeader } from './ui/card'
import { Separator } from "./ui/separator"

const HoseiLink = () => {
  return (
    <div className='w-full'>
      <Card className="bg-card/30 mt-32">
        <CardContent>
          <CardHeader className='font-bold text-lg text-center'>
            新アプリをリリースしました！
          </CardHeader>
          <div className="flex gap-2 items-center">
            <img src={HoseiLinkImage} alt="" className='size-24'/>
            <div>
              <p>「HoseiLink」授業情報と学生の声が集まる法政大学学内限定のSNSアプリです。授業を登録して同じ授業を登録しているユーザー同士や同じ学部・学科の人たちで交流することができます。</p>
              <a href="https://hosei-link.hosei-codemates.workers.dev/" className="font-bold underline text-xl text-center">HoseiLink</a>
            </div>
          </div>
        </CardContent>

      </Card>
      <Separator className="my-4" /> 
    </div>
  )
}

export default HoseiLink