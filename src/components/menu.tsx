// import React from 'react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './ui/sheet';
import { Link } from 'react-router-dom';
import { useTheme } from "./theme-provider"
import { MoonIcon, SunIcon, ShareNetworkIcon, ChatCenteredDotsIcon, InfoIcon, InstagramLogoIcon, ListIcon, GithubLogoIcon, DeviceMobileIcon } from "@phosphor-icons/react"
import { cn } from '@/lib/utils';

const Menu = () => {
  const { setTheme, theme } = useTheme()

  async function onShareClick() {
    await navigator.share({
      title: 'たまっぷ',
      text: 'https://codemates123.github.io/homepage/tamap.html'
    });
  }

  const buttonStyles = "flex bg-gray-900 dark:bg-zinc-950/80 shadow-xl mx-10 p-2 border border-zinc-700 rounded-lg text-white text-center hover:underline will-change-auto"
  const googleForm = "https://docs.google.com/forms/d/e/1FAIpQLScPysPRj60-S2v_zmFjrQF6YKlS0Qe200GSO4LnEMsiVbXxYg/viewform"
  const homepage = "https://codemates123.github.io/homepage/"
  const instagram = 'https://www.instagram.com/codemates_hosei?igsh=MTJvcmthMzUwOW90cg=='
  return (
    <div>
      {/* メニューを開くボタン */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="top-6 right-6 z-30 fixed bg-black/50 dark:bg-white/50 dark:bg-opacity-50 shadow-lg rounded-lg w-16 h-16 text-black not-dark:text-white"><ListIcon className='mx-auto' size={24} /></button>
        </SheetTrigger>
        <SheetContent className="bg-black/30 dark:bg-zinc-950/30 border-l border-l-gray-600" side='right'>
          <SheetTitle className="shadow-xl mt-3 text-white text-xl text-center">Menu</SheetTitle>
          <button className={cn(buttonStyles)} onClick={() => {
            if (theme === "light") {
              setTheme("dark")
            } else { setTheme("light") }
          }}>{theme === "light" ? <MoonIcon size={24} /> : <SunIcon size={24} />}<span className='mx-auto'>テーマを切り替える</span>
          </button>
          <Link className={cn(buttonStyles)}
            to={googleForm}>
            <ChatCenteredDotsIcon size={24} />
            <p className='mx-auto text-center'>アプリご意見</p></Link>
          <div className={cn(buttonStyles)} onClick={onShareClick}><ShareNetworkIcon size={24} /><p className='mx-auto text-center'>アプリを共有</p></div>
          <a className={cn(buttonStyles)}
            href={homepage}><InfoIcon size={24} /><p className='mx-auto text-center'>CODE MATESとは</p></a>
          <a className={cn(buttonStyles)}
            href={instagram}><InstagramLogoIcon size={24} /><p className='mx-auto text-center'>Instagram</p></a>
          <Link to="discount/" className={cn(buttonStyles)}>
            <DeviceMobileIcon size={24} />
            <p className='text-cener mx-auto'>
              飲食店割引はこちら
            </p>

          </Link>

          <a href="https://github.com/tommy10092525/vite-tamap" className='flex bg-gray-900 dark:bg-zinc-950/80 shadow-xl mx-10 p-2 border border-zinc-700 rounded-lg text-white text-center hover:underline will-change-auto' target='_blank'>
            <GithubLogoIcon size={24}></GithubLogoIcon>
            <p className='mx-auto text-center'>ソースコード</p></a>
        </SheetContent>

      </Sheet>
    </div>
  )
}

export default Menu
