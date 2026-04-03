import { Link } from 'react-router-dom'

const question = () => {
  return (
    <div className='max-w-2xl mx-auto p-4'>
      <Link to="/" className='underline'>戻る</Link><br />
      2026年4月1日より京王バスでは「西八王子駅直行便」，「めじろ台駅直行便」の新系列が設定されています。これらの系列の時刻については京王バスHPやNAVITIMEに一切記載がなく，法政大学が公表している時刻表でのみ各バス停からの発車時刻が確認できる状況になっています。<br /><a className='hover:underline text-blue-600' href="https://www.hosei.ac.jp/tama/important/article-20260319100900/">【多摩キャパス】4月1日以降の京王バスの運行及びバスロータリーにおける整列方法について</a>
      <br />現時点（2026年3月31日）の対応としては，バスの時刻が確定している4/6までについて，直行便についてはバス停の出発時刻のみを案内しています。
      <br />※参考<br />
      <a className='hover:underline text-blue-600' href="https://www.hosei.ac.jp/application/files/6017/7443/1839/2026guidance_keio_bus_schedule.pdf">「西八王子駅・めじろ台駅↔法政大学」急行便・直行便時刻表</a>

    </div>
  )
}

export default question