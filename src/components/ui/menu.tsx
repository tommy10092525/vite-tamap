// import React from 'react'
import {Sheet, SheetContent, SheetTitle, SheetTrigger } from './sheet';
import { Link } from 'react-router-dom';

const menu = () => {
  return (
    <div>
      {/* メニューを開くボタン */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="top-6 right-6 z-30 fixed bg-black/50 dark:bg-white/50 dark:bg-opacity-50 shadow-lg rounded-lg w-32 h-16 font-bold text-white dark:text-black">Menu</button>
        </SheetTrigger>
        <SheetContent className="bg-blue-500/30 dark:bg-zinc-950/30 border-l border-l-blue-500/70 dark:border-l-gray-600">
          <SheetTitle className="shadow-xl mt-3 text-white text-xl text-center">Menu</SheetTitle>
          <Link className="block bg-gray-900 dark:bg-zinc-950/80 shadow-xl mx-10 p-2 border border-zinc-700 rounded-lg text-white text-center hover:underline will-change-auto"
            to='https://docs.google.com/forms/d/e/1FAIpQLScPysPRj60-S2v_zmFjrQF6YKlS0Qe200GSO4LnEMsiVbXxYg/viewform?usp=sf_link'>アプリご意見</Link>
          <p className="block bg-gray-900 dark:bg-zinc-950/80 shadow-xl mx-10 p-2 border border-zinc-700 rounded-lg text-white text-center hover:underline will-change-auto share-btn" onClick={async () => {
            if (navigator.share) {
              try {
                await navigator.share({
                  title: 'たまっぷ',
                  text: 'https://codemates123.github.io/homepage/tamap.html'
                });
                console.log('Page shared successfully');
              } catch (error) {
                console.error('Error sharing:', error);
              }
            }
          }}>アプリを共有</p>
          <a className="block bg-gray-900 dark:bg-zinc-950/80 shadow-xl mx-10 p-2 border border-zinc-700 rounded-lg text-white text-center hover:underline will-change-auto"
            href='https://codemates123.github.io/homepage/'>CODE MATESとは</a>
          <a className="block bg-gray-900 dark:bg-zinc-950/80 shadow-xl mx-10 p-2 border border-zinc-700 rounded-lg text-white text-center hover:underline will-change-auto"
            href='https://www.instagram.com/codemates_hosei?igsh=MTJvcmthMzUwOW90cg=='>Instagram</a>
        </SheetContent>

      </Sheet>
    </div>
  )
}

export default menu
