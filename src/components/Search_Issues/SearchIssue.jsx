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
    <div className="ml-[31.5%] max-sm:ml-4 align-center mt-20 flex-col">
      <div className="flex">
        <div className="flex">
          <p className="font-robotomono font-semibold text-subtitleColor text-md max-sm:text-md">Repositories' Issues</p>
        </div>
        <div className="flex font-robotomono font-normal text-buttonColor ml-[31%] max-sm:mr-4 hover:text-titleColor text-sm max-sm:text-md">
          <button onClick={handleSearch} className="">Search</button>
        </div>
        </div>
        <div>
        <input
          type="text"
          placeholder="Enter repository names who's issues you want to prioritize"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
          className="text-sm max-sm:text-xxs mt-2 max-sm:mt-1 bg-inputColor rounded-sm p-2 max-sm:p-1 border border-borderColor w-[54.5%] max-sm:w-[95%] font-robotomono font-normal text-subtitleColor"
        />
      </div>
    </div>
  );
};

export default SearchIssues;