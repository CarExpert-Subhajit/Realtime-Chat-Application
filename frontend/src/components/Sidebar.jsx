import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Menu, X, Search } from "lucide-react";
import axios from "axios";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // 1️⃣ Fetch sidebar data on mount
  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // 2️⃣ Derive the “recent chats” list by filtering out users with no messages
  const recentUsers = users.filter(
    (u) => new Date(u.lastMessageTime) > new Date(u.createdAt)
  );

  // 3️⃣ Decide what to display: search results (if any) else recent users
  const displayList = searchResults.length ? searchResults : recentUsers;

  // 4️⃣ Search handler
  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setIsSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `/api/auth/search?username=${encodeURIComponent(searchInput.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchResults(res.data);
      if (!res.data.length) setSearchError("No users found");
    } catch (err) {
      setSearchError(err.response?.data?.message || "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  // 5️⃣ When you click a user (either from search or recent), open chat
  //    and clear the search results
  const onUserClick = (user) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchInput("");
  };

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className={`h-full p-2 ${sidebarExpanded ? "w-72" : "w-20"} lg:w-72 border-r-2 border-base-300 flex flex-col`}>

      {/* Top: Search Box */}
      <div className="flex p-2  border-b border-base-300">
        <div className="m-1  flex items-center gap-2 ">
          <button onClick={() => setSidebarExpanded(prev => !prev)}
            className="text-primary  p-1">

            {sidebarExpanded ? (
              <X strokeWidth={2.5} className="block lg:hidden size-6 " />
            ) : (
              <Menu strokeWidth={3} className="block lg:hidden size-6" />)}
          </button>
        </div>
        <div className={`flex m-1 gap-2 ${sidebarExpanded ? "" : "hidden lg:flex"} `}>

          <div className="relative w-9/12 max-w-xs flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
 
                if (searchError) setSearchError("");
              }}
              placeholder="username"
              className="input input-sm w-full input-bordered input-accent pr-8 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />

             {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearchError("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            )}
          </div>
          <div>

          <button
            onClick={handleSearch}
            disabled={isSearching || !searchInput.trim()}
            className="btn btn-sm btn-accent"
            >
            {isSearching ? "..." : <Search className={`size-3 ${isSearching || !searchInput.trim() ? "text-accent" : "text-secondory"}`} strokeWidth={3} />}
          </button>
            </div>
        </div>
      </div>
      {searchError && (
        <div className="text-red-500 text-xs m-1">{searchError}</div>
      )}

      {/* List */}
      <div className="overflow-y-auto flex-1 ">
        {displayList.length === 0 ? (
          <div className="text-center text-zinc-500 py-4">
            {searchResults.length
              ? "No matching users"
              : "No recent chats. Search to start!"}
          </div>
        ) : (
          displayList.map((user) => (
            <UserButton
              key={user._id}
              user={user}
              isSelected={selectedUser?._id === user._id}
              online={onlineUsers.includes(user._id)}
              onClick={() => onUserClick(user)}
              sidebarExpanded={sidebarExpanded}
            />
          ))
        )}
      </div>
    </aside>
  );
};

const UserButton = ({ user, isSelected, online, onClick, sidebarExpanded }) => (
  <button
    onClick={onClick}
    className={` w-full p-1 py-3 flex rounded-lg items-center gap-3 my-2 hover:bg-base-300 transition-colors ${isSelected ? "bg-base-200" : ""}`}
  >
    <div className="relative ">
      <img
        src={user.profilePic || "/avatar.png"}
        alt={user.fullName}
        className="size-12 rounded-full object-cover"
      />
      {online && (
        <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
      )}
    </div>
    <div className={` ${sidebarExpanded ? "lg:block" : "hidden lg:block"} truncate`}>
      {user.fullName}
    </div>
  </button>
);

export default Sidebar;
