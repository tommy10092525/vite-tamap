import React from 'react'
import { Link } from 'react-router-dom'
type StoreCardProps = {
  storeName: string
  storeImage: string
  storeDescription: string
  url: string,
  children: React.ReactNode
}
const StoreCard = ({ storeName, storeImage, storeDescription, url, children }: StoreCardProps) => {
  return (
    <Link
      to={url}
      className='bg-gray-100 dark:bg-zinc-900 shadow-lg dark:border border-0 dark:border-zinc-700 rounded-lg transition-all duration-300 group'
    >
      <div className='mx-auto rounded-t-lg aspect-[16/9] overflow-hidden'>
        <img width={1000} height={1000} src={storeImage} alt={`${storeName}の画像`} className='mx-auto rounded-t-lg  group-hover:scale-110 transition-all' />
      </div>
      <div className='text-center'>
        <p className='text-md'>{storeDescription}</p>
        <p className='font-bold text-3xl'>{storeName}</p>
        <div className='text-rose-500'>{children}</div>
      </div>
    </Link>
  )
}

export default StoreCard
