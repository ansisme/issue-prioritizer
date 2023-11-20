// SearchIssues.js
import React, { useState } from "react";

const SearchIssues = ({ onSearch }) => {
  const [repoName, setRepoName] = useState("");

  const handleSearch = () => {
    if (repoName.trim() !== "") {
      onSearch(repoName);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter repository name"
        value={repoName}
        onChange={(e) => setRepoName(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>
    </div>
  );
};

export default SearchIssues;
