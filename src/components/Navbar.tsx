"use client";

import { UserButton, SignOutButton, useUser } from "@clerk/nextjs";

const Navbar = () => {
  const { user } = useUser();

  
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4 justify-end w-full">

        {/* User info */}
        <div className="flex flex-col text-right">
          <span className="text-xs font-medium">
            {user?.fullName || user?.username || "User"}
          </span>
          <span className="text-[10px] text-gray-500">
            {user?.publicMetadata?.role as string}
          </span>
        </div>

        {/* Profile avatar */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-9 h-9",
            },
          }}
        />

        {/* 🔴 Logout with confirmation */}
        <SignOutButton>
          <button className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg font-semibold">
            Logout
          </button>
        </SignOutButton>

      </div>
    </div>
  );
};

export default Navbar;