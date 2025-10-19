import { Link } from 'react-router-dom'

const DiscountLink = () => {
  return (
    <Link
      to="/discount"
      className="block bg-linear-to-r/decreasing from-red-500 to-blue-500 shadow-lg md:m-0 p-4 rounded-full w-full font-bold text-white text-2xl text-center items-center hover:underline">
      飲食店割引はこちら
    </Link >)

}

export default DiscountLink