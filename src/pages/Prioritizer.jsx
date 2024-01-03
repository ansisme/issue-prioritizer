import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Profile from "../components/Profile/profile";
import SearchIssue from "../components/Search_Issues/SearchIssue";
import SignIn from '../pages/SignIn';

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
        console.log('hi')
        //  https://priority-server.onrender.com/predict
        const prioritiesResponse = await fetch('https://priority-server.onrender.com/predict', {
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
                <p className="font-normal text-subtitleColor ml-[31.5%] mt-2"> Total issues-{repoIssues.length + prioritiesData.issues.length}</p>
                <ol className="ml-[30%]">
                  {prioritiesData.issues.map((issue) => (
                    <li key={issue.id} className=" m-5 p-5 bg-cardColor rounded-md  w-[54.5%] h-[30%] ">
                      <div className="flex-col">
                        <div className="flex justify-between">
                          <p className="text-headingColor float-left font-semibold text-xl">Title: {issue.title}</p>
                          <p className="mt-2 justify-between float-right text-titleColor text-sm ">ID: {issue.id}</p>
                        </div>
                        <div className="text-paragraphColor text-sm flex-col">
                          <p>State: {issue.state}</p>
                          <p>Comments: {issue.comments}</p>
                          <p>Priority: {issue.priority}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

            </div>
          ) : searchedRepo ? (
            <p className="mt-2  text-sm font-normal ml-[31.5%] text-titleColor">No issues found in this repository / Enter the correct repository name</p>
          ) : null}
        </div>
        <div className=" text-sm font-normal ml-[31.5%] text-buttonColor hover:text-titleColor">
          <button onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>

      </div>
    );
  }
}
