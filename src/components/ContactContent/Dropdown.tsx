import { useState } from "react";
import { FaCaretDown } from "react-icons/fa";
import { FaCaretUp } from "react-icons/fa";
import type { ContactTopic } from "../../types/Contact";

type DropdownProps = {
  selectedOption: ContactTopic;
  setSelectedOption: React.Dispatch<React.SetStateAction<ContactTopic>>;
  id: string;
};

import DropdownItem from "./DropdownItem";
const Dropdown = ({ selectedOption, setSelectedOption, id }: DropdownProps) => {
  const [isDropdownOpen, setisDropdownOpen] = useState(false);
  return (
    <>
      <div
        id={id}
        className={`bg-surface relative z-8 flex max-w-full flex-1 flex-col rounded-2xl text-xl lg:max-w-[80%]`}
      >
        <button
          type="button"
          onClick={() => setisDropdownOpen(!isDropdownOpen)}
          className={`text-font-primary flex cursor-pointer items-center justify-between rounded-2xl p-1.5 px-4 ring-2 transition-all duration-200 outline-none ${
            isDropdownOpen ? "ring-brand-primary" : "ring-transparent"
          }`}
        >
          {selectedOption} {isDropdownOpen ? <FaCaretUp /> : <FaCaretDown />}
        </button>
        <div
          className={`bg-surface absolute top-full mt-1.5 w-full rounded-2xl transition-opacity duration-200 ease-in-out ${isDropdownOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <DropdownItem
            setisDropdownOpen={setisDropdownOpen}
            setSelectedOption={setSelectedOption}
            text="Feedback"
            className={`rounded-t-lg ${selectedOption === "Feedback" ? "bg-brand-tertiary text-font-secondary" : "bg-surface text-font-primary"}`}
          />
          <DropdownItem
            setisDropdownOpen={setisDropdownOpen}
            setSelectedOption={setSelectedOption}
            text="Bug Report"
            className={` ${selectedOption === "Bug Report" ? "bg-brand-tertiary text-font-secondary" : "bg-surface text-font-primary"}`}
          />
          <DropdownItem
            setisDropdownOpen={setisDropdownOpen}
            setSelectedOption={setSelectedOption}
            text="Feature Request"
            className={`rounded-b-lg ${selectedOption === "Feature Request" ? "bg-brand-tertiary text-font-secondary" : "bg-surface text-font-primary"}`}
          />
        </div>
      </div>
      <div
        className={`${isDropdownOpen ? "pointer-events-auto" : "pointer-events-none"} fixed top-0 right-0 h-full w-full`}
        onClick={() => {
          setisDropdownOpen(false);
        }}
      ></div>
    </>
  );
};

export default Dropdown;
