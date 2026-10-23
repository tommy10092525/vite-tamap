export function typeColor({line, trainType}:{line:string,trainType:string}){
  let trainTypeStyles=""
  let lineStyles=""
  if(line==="ＪＲ中央線"){
    lineStyles="bg-orange-500 text-black"
    if(trainType==="快速"){
      trainTypeStyles=""
    }else if(trainType==="各駅停車"){
      trainTypeStyles="bg-yellow-500 text-black"
    }else if(trainType==="中央特快"){
      trainTypeStyles="bg-blue-500 text-black"
    }else if(trainType==="通勤快速"){
      trainTypeStyles="bg-sky-500 text-black"
    }else if(trainType==="あずさ" || trainType==="かいじ" || trainType==="富士回遊"){
      trainTypeStyles="bg-red-500 text-black"
    }else if(trainType==="普通"){
      trainTypeStyles="bg-yellow-600 text-black"
    }else if(trainType==="むさしの号"){
      trainTypeStyles="bg-orange-800 text-white"
    }else if(trainType==="通勤特別快速"){
      trainTypeStyles="bg-pink-600 text-white"
    }else {
      trainTypeStyles="bg-transparent"
    }
  }else if(line==="京王高尾線"||line==="京王相模原線"||line==="京王線"){
    lineStyles="bg-pink-600 text-white"
    if(trainType==="各駅停車"){
      trainTypeStyles="bg-transparent"
    }else if(trainType==="快速"){
      trainTypeStyles="bg-blue-600 text-white"
    }else if(trainType==="区間急行"){
      trainTypeStyles="bg-lime-300 text-black"
    }else if(trainType==="急行" || trainType==="急行・新線新宿から各停"||trainType=="各停・高幡不動から急行"){
      trainTypeStyles="bg-green-500 text-black"
    }else if(trainType==="特急" || trainType==="各停・京王多摩センターから特急"||trainType=="各停・高幡不動から特急"){
      trainTypeStyles="bg-red-500 text-black"
    }else if(trainType==="京王ライナー"){
      trainTypeStyles="bg-pink-600 text-white"
    }else if(trainType==="Ｍｔ．ＴＡＫＡＯ"){
      trainTypeStyles="bg-green-700 text-white"
    }else{
      trainTypeStyles="bg-gray-500 text-white"
    }
  }else if(line==="ＪＲ横浜線"){
    lineStyles="bg-green-600 text-black"
    if(trainType==="快速"){
      trainTypeStyles="bg-pink-500 text-black"
    }else{
      trainTypeStyles="bg-transparent"
    }
  }else if(line==="ＪＲ相模線"){
    lineStyles="bg-teal-500 text-black"
    trainTypeStyles="bg-gray-500 text-white"
  }else if(line==="ＪＲ八高線"){
    lineStyles="bg-gray-500 text-white"
    trainTypeStyles="bg-transparent"
  } 
  return {trainTypeStyles, lineStyles}
}