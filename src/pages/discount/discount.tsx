import { Link } from "react-router-dom"
// import logo from "../../../public/images/tamap_logo.png"
import StoreCard from '../../components/ui/store-card'
const page = () => {

  return (
    <div className='bg-zinc-100 dark:bg-zinc-950 min-h-screen text-black dark:text-white'>
      <header className='top-0 right-0 left-0 z-10 fixed bg-[#ff6347] px-4 py-4 text-white'>
        <Link to="/" className='float-left'>
          <img src="images/tamap_logo.png" alt="たまっぷのロゴ" width={400} height={400} className='-my-4 w-16 h-16' />
        </Link>
        <h1 className='font-bold text-2xl text-center'>たまっぷ 提携店舗一覧</h1>
      </header>
      <div className='gap-8 grid grid-cols-1 md:grid-cols-2 mx-auto mt-16 p-8 max-w-5xl'>
        {[
          { storeName: '藤', storeImage: 'images/fuji.jpg', storeDescription: 'めじろ台　うどん屋', url: '/fuji', children: <p>普通盛り50円引き<br />大盛無料</p> },
          { storeName: 'ハイチーズ', storeImage: 'images/hicheese.jpg', storeDescription: '八王子　チーズ料理', url: '/hicheese', children: <p>ランチソフトドリンク無料<br />コースディナー500円引き<br />飲み放題30分延長</p> },
          // { storeName: '吾衛門', storeImage: '/goemon.jpg', storeDescription: '西八王子　ラーメン店', url: '/discount/goemon', children: <p>大盛無料</p> },
          { storeName: 'コクテル堂', storeImage: 'images/kokuterudou.jpg', storeDescription: '橋本　カフェ', url: '/kokuterudo', children: <p>ケーキ×ドリンクのセット<br />さらに100円引き</p> }
        ].map((store, index) => (
          <StoreCard key={index} {...store} />
        ))}
      </div>
    </div>
  )
}

export default page
