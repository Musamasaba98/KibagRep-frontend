import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";

function SearchBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (

    <form className=" w-[31%]">

      <div className="flex bg-cyan-400 rounded-md overflow-hidden">
        <label htmlFor="search-dropdown" className="sr-only">
          Your Email
        </label>
        <button
          id="dropdown-button"
          onClick={toggleDropdown}
          type="button"
          className="flex-shrink-0 z-10 bg-cyan-400 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-100 "
        >
          All categories <FaChevronDown className="w-2.5 h-2.5 ms-2.5" />
        </button>
        {isDropdownOpen && (
          <div
            id="dropdown"
            className="absolute mt-10 w-44 z-10 bg-white divide-y divide-gray-100 rounded-lg shadow"
          >
            <ul
              className="py-2 text-sm text-gray-700"
              aria-labelledby="dropdown-button"
            >
              <li>
                <button
                  type="button"
                  className="inline-flex w-full px-4 py-2 hover:bg-gray-100"
                >
                  Mockups
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="inline-flex w-full px-4 py-2 hover:bg-gray-100"
                >
                  Templates
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="inline-flex w-full px-4 py-2 hover:bg-gray-100"
                >
                  Design
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="inline-flex w-full px-4 py-2 hover:bg-gray-100"
                >
                  Logos
                </button>
              </li>
            </ul>
          </div>
        )}
        <div className="relative w-full">
          <input
            type="search"
            id="search-dropdown"
            className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 border-l-2 border-gray-300 rounded-e-lg focus:outline-none"
            placeholder="Search Mockups, Logos, Design Templates..."
            required
          />
          <button
            type="submit"
            className="absolute top-0 right-0 p-2.5 text-sm font-medium h-full text-white bg-cyan-400 rounded-e-lg "
          >
            <svg
              className="w-4 h-4"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
            <span className="sr-only">Search</span>
          </button>
        </div>
      </div>
    </form>

  );
}

export default SearchBar;
