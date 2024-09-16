import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Profile from "../components/Profile/profile";
import SearchIssue from "../components/Search_Issues/SearchIssue";
import SignIn from '../pages/SignIn';
import Pagination from "../components/Pagination/Pagination";
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [session, setSession] = useState(null);
  const [githubDetails, setGithubDetails] = useState({
    avatar: "",
    name: "",
    email: "",
    followers: 0,
    following: 0,
    username: "",
    repositories: [],
  });
  const [searchedRepo, setSearchedRepo] = useState(' ');
  const [repoIssues, setRepoIssues] = useState([]);
  const [prioritiesData, setPrioritiesData] = useState({
    issues: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [issuesperpage] = useState(10);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session && session.user && session.user.user_metadata) {
          const githubUsername = session.user.user_metadata.preferred_username;

          const githubResponse = await fetch(`https://api.github.com/users/${githubUsername}`);
          const githubData = await githubResponse.json();

          const reposResponse = await fetch(`https://api.github.com/users/${githubUsername}/repos?type=all`);
          const reposData = await reposResponse.json();

          const updatedGithubDetails = {
            avatar: session.user.user_metadata.avatar_url,
            name: session.user.user_metadata.full_name,
            email: session.user.email,
            followers: githubData.followers,
            following: githubData.following,
            username: githubUsername,
            repositories: reposData.map(repo => repo.name),
          };

          setGithubDetails(updatedGithubDetails);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    fetchData();
    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = async (repoName) => {
    setSearchedRepo(repoName);

    if (repoName) {
      try {
        const response = await fetch(`https://api.github.com/repos/${githubDetails.username}/${repoName}/issues`);
        const issuesData = await response.json();

        console.log("issues data:", issuesData);
        console.log(githubDetails.username, repoName)
        const prioritiesResponse = await fetch('http://localhost:5000/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repo_owner: githubDetails.username,
            repo_name: repoName,
            issues: issuesData,
            forks: true,
          }),
        });

        const prioritiesData = await prioritiesResponse.json();
        console.log("Priorities Data:", prioritiesData);
        console.log("Length: ", prioritiesData.issues.length)

        if (prioritiesData.issues && Array.isArray(prioritiesData.issues)) {
          setRepoIssues(issuesData);
          setPrioritiesData(prioritiesData);

        } else {
          console.error('Priorities data is not an array:', prioritiesData);
          setRepoIssues([]);
          setPrioritiesData({ issues: [] });
        }
      } catch (error) {
        console.error("Error fetching issues:", error);
      }
    } else {
      setRepoIssues([]);
      setPrioritiesData({ issues: [] });
    }
  };


  const indexOfLastIssue = currentPage * issuesperpage;
  const indexOfFirstIssue = indexOfLastIssue - issuesperpage;
  const currentIssues = prioritiesData.issues.slice(indexOfFirstIssue, indexOfLastIssue);

  const paginateFront = () => setCurrentPage(currentPage + 1);
  const paginateBack = () => setCurrentPage(currentPage - 1);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [currentPage]);

  if (!session) {
    return (
      <div>
        <SignIn supabase={supabase} />
      </div>
    );
  } else {
    return (

      <div className="flex-col items-center">
        <div className="mb-4">
          <Profile {...githubDetails} />
        </div>
        <div className="mb-4">
          <SearchIssue onSearch={handleSearch} />
          {searchedRepo && repoIssues.length > 0 || prioritiesData.issues.length > 0 ? (
            <div className="">
              <div className="">
                <p className="font-normal text-subtitleColor ml-[31.5%] max-sm:ml-4 max-md:ml-[5%] max-lg:ml-[25%] max-xl:ml-[25%] mt-2 max-sm:mt-1 max-sm:text-md max-md:text-sm "> Total issues-{prioritiesData.issues.length}</p>
                <ol className="ml-[30%] max-sm:ml-2 max-md:ml-[3%] max-lg:ml-[23%] max-xl:ml-[23%]">
                  {currentIssues.map((issue) => (
                    <li key={issue.id} className=" m-5 p-5 max-sm:m-3 max-md:m-4 max-sm:p-3 bg-cardColor rounded-md  w-[54.5%] max-sm:w-[90%] max-md:w-[95%] max-md:w-[65%] max-lg:w-[65%] max-xl:w-[65%] h-auto ">
                      <div className="flex-col">
                        <div className="flex justify-between">
                          <p className="text-headingColor float-left font-semibold text-xl max-sm:text-md max-md:text-sm mb-2 max-sm:leading-4 max-md:leading-5">Title: {issue.title}</p>

                          <p className="mt-2 justify-between float-right text-titleColor text-sm max-sm:text-xxs max-md:text-md">
                            ID: {issue.id}
                          </p>
                        </div>
                        <div className="text-paragraphColor text-sm max-sm:text-xxs max-md:text-md flex-col max-sm:leading-4 max-md:leading-5 ">
                          <p>State: {issue.state}</p>
                          <p>Comments: {issue.comments}</p>
                          <p>Labels: {issue.label_names.join(', ')}</p>
                          <p className="font-bold text-titleColor">Priority: {issue.priority}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <Pagination
                issuesperpage={issuesperpage}
                totalIssues={prioritiesData.issues.length}
                paginateBack={paginateBack}
                paginateFront={paginateFront}
                currentPage={currentPage}
              />
            </div>
          ) : searchedRepo ? (
            <p className="mt-2  text-sm max-sm:text-xxs max-md:text-md font-normal ml-[31.5%]  max-sm:ml-4 max-md:ml-[25%] text-titleColor">No issues found in this repository / Enter the correct repository name</p>
          ) : null}
        </div>
        <div className=" text-sm max-sm:text-md mb-10 font-normal ml-[31.5%] max-sm:ml-4 max-md:ml-[5%] max-lg:ml-[25%] max-xl:ml-[25%] text-buttonColor hover:text-titleColor">
          <button onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>
    );
  }
}