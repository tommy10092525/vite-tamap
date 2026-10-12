// https://swiperjs.com/react

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import yatai from "@/images/屋台ポスター.png"
import kyousitsu from "@/images/教室企画_修整版.png"

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import { Autoplay, Pagination, Navigation } from 'swiper/modules';

const Carousel=() => {
  return (
    <Swiper
      spaceBetween={50}
      slidesPerView={1}
      onSlideChange={() => console.log('slide change')}
      onSwiper={(swiper) => console.log(swiper)}
      className="w-1/2"
      autoplay={{
        delay:4000,
        disableOnInteraction:true
      }}
      modules={[Autoplay,Pagination,Navigation]}
      loop={true}
    >
      <SwiperSlide>
        <img src={yatai} alt="" />
      </SwiperSlide>
      <SwiperSlide>
        <img src={kyousitsu} alt="" />
      </SwiperSlide>
    </Swiper>
  );
};

export default Carousel