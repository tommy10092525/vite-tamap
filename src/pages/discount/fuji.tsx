import { Link } from "react-router-dom"
import fujiImage from "@/images/fuji.webp"
import { Undo2 } from "lucide-react"

const Title = ({ children }: { children: React.ReactNode }) => {
  return <span className="font-semibold text-orange-500 text-lg">
    {children}<br/>
  </span>
}

const page = () => {
  return (
    <div className='bg-gray-100 dark:bg-zinc-950 p-8 min-h-screen text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black'>
      <title>藤 - たまっぷ提携店舗</title>
      <meta name="description" content="めじろ台駅近くのうどん屋「藤」。法政大学の学生証提示で、うどん普通盛りが50円引き、または大盛が無料になります。" />
      <Link to="/discount" className='top-2 left-2 fixed backdrop-blur-xs p-4 border-2 border-rose-500 rounded-full font-semibold text-lg'><Undo2></Undo2></Link>
      <div className='dark:bg-zinc-900 shadow-lg mx-auto mt-10 rounded-lg max-w-xl'>
        <img src={fujiImage} alt="うどん屋　藤の画像" width={500} height={500} className='rounded-t-lg w-full' />
        <div className='px-5 py-4'>
          <p className='mt-2 font-bold text-2xl text-center mb-2'>藤</p>
          めじろ台駅からわずか徒歩１分！ランチタイムにリーズナブルな価格で本格的なうどんが食べられます！多種多様なうどんの他に、丼ものもあります！<br />
          {/* <p className='font-semibold text-rose-400 text-lg'>割引内容</p> */}
          <Title>割引内容</Title>
          ・うどん普通盛50円引き<br />
          ・うどん大盛無料<br />
          上記から1つ選択できます。<br />
          <Title>割引方法</Title>
          ご注文時に、本画面と法政大学の学生証または教職員証をご提示ください。<br />
          <Title>営業日／定休日</Title>
          ランチ<br />
          11:00～15:00（ラストオーダー 14:30）<br />
          ディナー<br />
          17:00～21:00（ラストオーダー20:30）<br />
          定休日：（第２・３火曜日）水曜日<br />
          <Title>お支払方法</Title>
          現金、クレジットカード(VISA、マスター、JCBなど)、交通系IC(Suica、PASMOなど)、 QRコード決済(PayPay、楽天ペイなど)<br/>
          <Title>アクセス</Title>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1621.184591380742!2d139.30751329999998!3d35.6432748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60191c23cdc1bc8b%3A0x2131ebb723e16b12!2z44GG44Gp44KT5oeQ55-z5aSp44G344KJ5pes6a6u44O75ZKM6Iaz44O76Jek!5e0!3m2!1sja!2sjp!4v1727600041739!5m2!1sja!2sjp"
            className="rounded-lg w-full h-64"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade">
          </iframe>
          <Title>問い合わせ先</Title>
          042-662-8868<br/>
          〒193-0833 東京都八王子市めじろ台１丁目１００−１京王線 めじろ台駅より徒歩1分<br/>
          <Title>注意事項</Title>
          ・2026年3月31日まで有効です。<br />
          ・他飲食サイトの割引との併用はできません。<br />
          ・ご利用には、法政大学の学生証または教職員証のご提示が必要です。<br />
        </div>
      </div>
    </div>
  )
}

export default page
