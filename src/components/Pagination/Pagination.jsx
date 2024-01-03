import React from "react";

export default function Pagination({
  issuesperpage,
  totalIssues,
  paginateFront,
  paginateBack,
  currentPage,
}) {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage * issuesperpage >= totalIssues;

  return (
    <div className="text-center h-auto p-1 ml-12">
      <div>
        <p className="text-sm text-paragraphColor">
          Showing{" "}
          <span className="font-medium">
            {(currentPage * issuesperpage - issuesperpage) + 1}
          </span>{" "}
          to
          <span className="font-medium"> {currentPage * issuesperpage} </span>
          of
          <span className="font-medium"> {totalIssues} </span>
          results
        </p>
      </div>
      <nav className="block"></nav>
      <div>
        <nav
          className="text-sm text-paragraphColor hover:text-titleColor"
          aria-label="Pagination"
        >
          <button
            className={`p-1 ml-3 text-center justify-between align-center border-none border-8 bg-inherit ${
              isFirstPage ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
            onClick={() => !isFirstPage && paginateBack()}
            disabled={isFirstPage}
          >
            <span className="text-paragraphColor hover:text-titleColor">Previous</span>
          </button>
          <button
            className={`p-1 ml-3 text-center justify-between align-center border-none border-8 bg-inherit ${
              isLastPage ? "cursor-not-allowed opacity-50 " : "cursor-pointer "
            }`}
            onClick={() => !isLastPage && paginateFront()}
            disabled={isLastPage}
          >
            <span className=" text-paragraphColor hover:text-titleColor">Next</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

