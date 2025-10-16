import { Link } from 'react-router-dom'

const DiscountLink = () => {
  return (
    <Link
      to="/discount"
      className="block bg-gradient-to-r from-red-500 to-blue-500 shadow-lg md:m-0 my-2 p-3 border border-white/30 rounded-full w-full font-bold text-white text-3xl text-center">
      飲食店割引はこちら
    </Link >)

}

export default DiscountLink