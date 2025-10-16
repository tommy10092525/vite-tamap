import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { QuestionIcon, AppleLogoIcon, ExportIcon, AndroidLogoIcon, GoogleChromeLogoIcon, DotsThreeVerticalIcon } from '@phosphor-icons/react'
import { CompassIcon } from 'lucide-react'

const TamapHowToInstall = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="p-4 from-blue-400 to-blue-600 hover:ring-2 ring-blue-800 bg-gradient-to-br transition-all text-white font-semibold text-xl rounded-lg flex hover:underline">
          <QuestionIcon size={32} />
          <span className="text-center mx-auto">
            たまっぷ　インストール方法
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="border-2 border-black/50 bg-black/30 text-white backdrop-blur-md rounded-md shadow-lg fixed p-4 w-full">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">たまっぷ　インストール方法</DialogTitle>
        </DialogHeader>
        <div className="**:items-center">
          <span className="flex">
            <AppleLogoIcon size={32} />iPhone<CompassIcon size={32} />Safariで開いてください
          </span>
          <ul className="p-2">
            <li className="flex">シェア<ExportIcon size={32} />を押す</li>
            <li>「ホーム画面に追加」を選択</li>
          </ul>
        </div>
        <div className="**:items-center">
          <span className="flex"><AndroidLogoIcon size={32} />Android<GoogleChromeLogoIcon size={32} />
            Chromeで開いてください
          </span>
          <ul className="p-2">
            <li className="flex">3点ボタン<DotsThreeVerticalIcon size={32} />を押す</li>
            <li>「ホーム画面に追加」を選択</li>
            <li>「インストール」を選択<br />（※ショートカットにしないでください！）</li>
          </ul>
          <a href="https://codemates123.github.io/homepage/tamap.html" className="text-lg underline font-semibold text-center text-blue-600">詳細はこちら</a>
        </div>
      </DialogContent>

    </Dialog>
  )
}

export default TamapHowToInstall