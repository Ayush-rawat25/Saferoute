import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png"

function Navbar() {
  return (
    <div>
      <header className="flex justify-center items-center px-6 py-4 bg-indigo-950 shadow-md">
        <div className="flex items-center gap-10">
          {/* Logo and Heading */}
          <div className="flex items-center gap-2 text-2xl font-bold text-white">
            <img src={logo} className=" h-16" alt="" />
            <span className="text-white">SafeRoute</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-6 text-base font-medium text-gray-200">
            <Link to="/" className="hover:text-blue-400 transition">
              Home
            </Link>
            <Link to="/about" className="hover:text-blue-400 transition">
              About
            </Link>
          </nav>
        </div>
      </header>
    </div>
  );
}

export default Navbar;
