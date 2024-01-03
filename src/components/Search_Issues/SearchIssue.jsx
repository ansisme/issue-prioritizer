import React, { useState } from "react";

const SearchIssues = ({ onSearch }) => {
  const [repoName, setRepoName] = useState("");

  const handleSearch = () => {
    console.log("button clicked")
    if (repoName.trim() !== "") {
      onSearch(repoName);
    }
  };

  return (
    <div className="ml-[31.5%] align-center mt-20 flex-col">
      <div className="flex">
        <div className="flex">
          <p className="font-robotomono font-semibold text-subtitleColor text-md ">Repositories' Issues</p>
        </div>
        <div className="flex font-robotomono font-normal text-buttonColor ml-[31%] hover:text-titleColor text-sm">
          <button onClick={handleSearch} className="">Search</button>
        </div>
        </div>
        <div>
        <input
          type="text"
          placeholder="Enter repository names who's issues you want to prioritize"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
          className="text-sm mt-2 bg-inputColor rounded-sm p-2 border border-borderColor w-[54.5%] font-robotomono font-normal text-subtitleColor"
        />
      </div>
    </div>
  );
};

export default SearchIssues;