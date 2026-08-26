import React from 'react'
import wave from "@/components/images/Wave_Top.png"
import menuIcon from "@/components/images/Menu.svg"

const Header = () => {
  return (
    <header className="">
      <img src={menuIcon} alt="" className="left-0 absolute size-9 m-4" />
      <img src={wave} className="w-full max-h-40" alt="" />
    </header>
  )
}

export default Header