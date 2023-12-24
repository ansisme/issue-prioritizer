// import React, { useState, useEffect } from "react";
// import { createClient } from "@supabase/supabase-js";
// import { Auth } from "@supabase/auth-ui-react";
// import { ThemeSupa } from "@supabase/auth-ui-shared";
// import Profile from '../profile'
// import SearchIssue from "../SearchIssue";

// const supabaseUrl = 'https://dbsedophonqpzrnseplm.supabase.co';
// const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRic2Vkb3Bob25xcHpybnNlcGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk3MTA1NDUsImV4cCI6MjAxNTI4NjU0NX0.vMPEc1zF9PKvA5UCCMUutR__Z-cpfUY9pKzUsYJZCvE';
// const supabase = createClient(supabaseUrl, supabaseKey);

// export default function App() {
//   const [session, setSession] = useState(null);
//   const [githubDetails, setGithubDetails] = useState({
//     avatar: "",
//     name: "",
//     email: "",
//     followers: 0,
//     following: 0,
//     username: "",
//     repositories: [],
//   });
//   const [searchedRepo, setSearchedRepo] = useState(null);
//   const [repoIssues, setRepoIssues] = useState([]);
//   //new 
//   const [issuePriorities, setIssuePriorities] = useState({}); //new

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const { data: { session } } = await supabase.auth.getSession();
//         setSession(session);

//         if (session && session.user && session.user.user_metadata) {
//           const githubUsername = session.user.user_metadata.preferred_username;

//           // Fetch GitHub user data
//           const githubResponse = await fetch(`https://api.github.com/users/${githubUsername}`);
//           const githubData = await githubResponse.json();

//           // Fetch GitHub repositories
//           const reposResponse = await fetch(`https://api.github.com/users/${githubUsername}/repos`);
//           const reposData = await reposResponse.json();

//           const updatedGithubDetails = {
//             avatar: session.user.user_metadata.avatar_url,
//             name: session.user.user_metadata.full_name,
//             email: session.user.email,
//             followers: githubData.followers,
//             following: githubData.following,
//             username: githubUsername,
//             repositories: reposData.map(repo => repo.name),
//           };

//           setGithubDetails(updatedGithubDetails);
//         }
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       }
//     };

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//     });
//       fetchData();
//     return () => subscription.unsubscribe();
//   }, []);

//   const handleSearch = async (repoName) => {
//     setSearchedRepo(repoName);

//     if (repoName) {
//       try {
//         const response = await fetch(`https://api.github.com/repos/${githubDetails.username}/${repoName}/issues`);
//         const issuesData = await response.json();

//         //new
//         // Fetch issue priorities from the Flask API
//         const prioritiesResponse = await fetch('http://localhost:5000/train_and_evaluate', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ issues: issuesData }),
//         });
//         const prioritiesData = await prioritiesResponse.json();
//         console.log("Priorities Data:", prioritiesData); // Log the response

//         // Map issue IDs to their corresponding priorities
//         if (Array.isArray(prioritiesData)) {
//           // Map issue IDs to their corresponding priorities
//           const prioritiesMap = {};
//           prioritiesData.forEach((issue) => {
//             prioritiesMap[issue.id] = issue.priority_label;
//           });
//           //new
//           setRepoIssues(issuesData);
//           setIssuePriorities(prioritiesMap);

//           console.log("Repo Issues:", issuesData);
//           console.log("Issue Priorities:", prioritiesMap);
//         } else {
//           console.error('Priorities data is not an array:', prioritiesData);
//         }
//       }
//       catch (error) {
//         console.error("Error fetching issues:", error);
//       }
//     } else {
//       setRepoIssues([]);
//       setIssuePriorities({});
//     }
//   };

//   if (!session) {
//     return (
//       <div
//         style={{
//           width: "100vw",
//           height: "100vh",
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//         }}
//       >
//         <div>
//           <Auth
//             supabaseClient={supabase}
//             appearance={{ theme: ThemeSupa }}
//             providers={["github"]}
//           />
//         </div>
//       </div>
//     );
//   } else {
//     return (
//       <div>
//         <Profile {...githubDetails} />
//         <SearchIssue onSearch={handleSearch} />
//         {searchedRepo && repoIssues.length > 0 ? (
//           <div>
//             <h2>Issues for {searchedRepo}</h2>
//             <ul>
//               {repoIssues.map((issue) => (
//                 <li key={issue.id}>
//                   <p>{issue.title}</p>
//                   <p>Priority: {issuePriorities[issue.id]}</p>
//                 </li>

//               ))}
//             </ul>
//           </div>
//         ) : searchedRepo ? (
//           <p>No issues in this repo</p>
//         ) : null}
//         <button onClick={() => supabase.auth.signOut()}>Sign out</button>
//       </div>
//     );
//   }
// }


import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import Profile from '../components/profile'
import SearchIssue from "../SearchIssue";
import axios from "axios";
const supabaseUrl = 'https://dbsedophonqpzrnseplm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRic2Vkb3Bob25xcHpybnNlcGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk3MTA1NDUsImV4cCI6MjAxNTI4NjU0NX0.vMPEc1zF9PKvA5UCCMUutR__Z-cpfUY9pKzUsYJZCvE';
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
  const [issuePriorities, setIssuePriorities] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session && session.user && session.user.user_metadata) {
          const githubUsername = session.user.user_metadata.preferred_username;

          const githubResponse = await fetch(`https://api.github.com/users/${githubUsername}`);
          const githubData = await githubResponse.json();

          const reposResponse = await fetch(`https://api.github.com/users/${githubUsername}/repos`);
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
        console.log(response)
        console.log("issues data:", issuesData)
        // Fetch issue priorities from the Flask API
        //AXIOS
        // axios.post('http://localhost:5000/predict')
        // .then((response) => {
        //   setIssuePriorities(response.data['your priorities']);
        // })
        // .catch((error)=>{
        //   console.log(error)
        // })

        //NORMAL FETCH
        const prioritiesResponse = await fetch('http://localhost:5000/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            repo_owner: githubDetails.username,
            repo_name: repoName,
            issues: issuesData,
          }),
        });
        // const prioritiesData =[prioritiesResponse.json()]
        const prioritiesData = await prioritiesResponse.json();
        //make an array to push the priority data
        // const pdata = [prioritiesData]; //array
        // //push the priority data to the array
        // pdata.push(prioritiesData);
        // console.log("Priorities Data:", pdata); // Able to see the priority in the console
        // if (pdata!==null) {
        //   const prioritiesMap = {};
        //   pdata.forEach((issue) => {
        //     prioritiesMap[issue.id] = issue.priority;
        //     // console.log(issue.priority)
        //   });

        if (prioritiesData.issues && Array.isArray(prioritiesData.issues)) {
          const prioritiesMap = {};
          prioritiesData.issues.forEach((issue) => {
            prioritiesMap[issue.id] = issue.priority;
          });
          console.log("Priorities Data:", prioritiesData); // Log the response

          setRepoIssues(issuesData);
          // setIssuePriorities(prioritiesMap);
          setIssuePriorities(prioritiesMap);
        } else {
          console.error('Priorities data is not an array:', prioritiesData);
        }
      }
      catch (error) {
        console.error("Error fetching issues:", error);
      }
    } else {
      setRepoIssues([]);
      setIssuePriorities({});
    }
  };

  if (!session) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={["github"]}
          />
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <Profile {...githubDetails} />
        <SearchIssue onSearch={handleSearch} />
        {searchedRepo && repoIssues.length > 0 ? (
          <div>
            <h2>Issues for {searchedRepo}</h2>
            <ul>
              {repoIssues.map((issue) => (
                <li key={issue.id}>
                  <p>Title {issue.title}</p>
                  <p>ID: {issue.id}</p>
                  <p>State: {issue.state}</p>
                  <p>Comments: {issue.comments}</p>
                  <p>Created_at: {issue.created_at}</p>
                  <p>Priority: {issuePriorities[issue.id]}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : searchedRepo ? (
          <p>No issues in this repo</p>
        ) : null}
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    );
  }
}
