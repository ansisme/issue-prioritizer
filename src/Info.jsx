// // Info.jsx
// import React, { useState, useEffect } from "react";
// import Profile from "./profile";
// import SearchIssue from "./SearchIssue";

// const Info = ({ supabase }) => {
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

//     fetchData();

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//     });

//     return () => subscription.unsubscribe();
//   }, [supabase]);

//   const handleSearch = async (repoName) => {
//     setSearchedRepo(repoName);

//     if (repoName) {
//       try {
//         const response = await fetch(`https://api.github.com/repos/${githubDetails.username}/${repoName}/issues`);
//         const issuesData = await response.json();
//         setRepoIssues(issuesData);
//       } catch (error) {
//         console.error("Error fetching issues:", error);
//       }
//     } else {
//       setRepoIssues([]);
//     }
//   };

//   return (
//     <div>
//       <Profile {...githubDetails} />
//       <SearchIssue onSearch={handleSearch} />
//       {searchedRepo && repoIssues.length > 0 ? (
//         <div>
//           <h2>Issues for {searchedRepo}</h2>
//           <ul>
//             {repoIssues.map((issue) => (
//               <li key={issue.id}>{issue.title}</li>
//             ))}
//           </ul>
//         </div>
//       ) : searchedRepo ? (
//         <p>No issues in this repo</p>
//       ) : null}
//       <button onClick={() => supabase.auth.signOut()}>Sign out</button>
//     </div>
//   );
// };

// export default Info;
