import React from "react";
import Title from "../Title/Title";
import Cover from '../../images/Cover.png'
import logo from '../../images/logo.png'
import './styles.css'
const Profile = ({ avatar, name, email, followers, following, username, repositories }) => {
  return (
    <div>
      <div className="flex-col mx-auto">
        <div className="z-10 absolute inset-x-0 top-[8%] justify-center align-center flex">
          <div className="flex-col">
            <div className="flex ml-[30%] mb-4">
              <img src={logo} alt="logo" className="flex mr-2" />
              <img src={logo} alt="logo" className="flex flip" />
            </div>

            <Title
              className="justify-center align-center" />
          </div>
        </div>
        <div className="z-0 relative">
          <img src={Cover}
            className="w-screen"
            alt="Cover" />
        </div>
        
        <div className="flex z-10  justify-center items-center align-center">
          <div className="bg-profileColor max-h-md max-w-xl mb-20 rounded-xl left-1/2  transform -translate-x-1/2  absolute justify-center items-center align-center">
            <div className="flex">
              <img
                src={avatar}
                className="w-[30%] p-5 flex rounded-3xl"
                alt={`${username}'s avatar`} />
              <div className="font-robotomono p-5">
                <p className="text-2xl font-bold text-headingColor mb-2"> {name}</p>
                <div className="text-sm font-semibold text-paragraphColor ">
                  <p>{username}</p>
                  <p>{email}</p>
                  <p>{followers} followers</p>
                  <p>{following} following</p>
                </div>
              </div>
              <div className="flex p-5">
                <a
                  href={`https://github.com/${username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex"
                >
                  <p className="text-titleColor font-robotomono font-semibold text-sm">
                    GITHUB
                  </p>
                  <div className="ml-1 mt-[3px]">
                    <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g id="Icon" clip-path="url(#clip0_1802_12)">
                        <path id="Vector" d="M6.80357 1.67857C6.80357 1.23485 7.16267 0.875 7.60714 0.875H10.7988C10.9294 0.875 11.0349 0.896596 11.1278 0.936021C11.2006 0.974944 11.3111 1.03245 11.389 1.10854C11.389 1.10979 11.389 1.11105 11.3915 1.11205C11.5472 1.26825 11.6024 1.47215 11.625 1.67606C11.625 1.67706 11.625 1.67782 11.625 1.67857V4.89286C11.625 5.33733 11.2659 5.69643 10.8214 5.69643C10.377 5.69643 10.0179 5.33733 10.0179 4.89286V3.6197L5.76395 7.87109C5.45006 8.18499 4.9428 8.18499 4.62891 7.87109C4.31501 7.5572 4.31501 7.04994 4.62891 6.73605L8.8803 2.48214H7.60714C7.16267 2.48214 6.80357 2.12229 6.80357 1.67857ZM0.375 3.28571C0.375 2.39802 1.09445 1.67857 1.98214 1.67857H4.39286C4.83733 1.67857 5.19643 2.03842 5.19643 2.48214C5.19643 2.92662 4.83733 3.28571 4.39286 3.28571H1.98214V10.5179H9.21429V8.10714C9.21429 7.66267 9.57338 7.30357 10.0179 7.30357C10.4623 7.30357 10.8214 7.66267 10.8214 8.10714V10.5179C10.8214 11.4043 10.1007 12.125 9.21429 12.125H1.98214C1.09445 12.125 0.375 11.4043 0.375 10.5179V3.28571Z" fill="#3294F8" />
                      </g>
                      <defs>
                        <clipPath id="clip0_1802_12">
                          <rect width="12" height="12" fill="white" transform="translate(0 0.5)" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
