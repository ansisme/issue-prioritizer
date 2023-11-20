// Profile.jsx
import React from "react";

const Profile = ({ avatar,name, email, followers, following, username, repositories }) => {
  return (
    <div>
      <img src={avatar} alt={`${username}'s avatar`} />
      <p>Name: {name}</p>
      <p>Email: {email}</p>
      <p>Followers: {followers}</p>
      <p>Following: {following}</p>
      <p>Username: {username}</p>
      <p>Repositories: {repositories}</p>
    </div>
  );
};

export default Profile;
