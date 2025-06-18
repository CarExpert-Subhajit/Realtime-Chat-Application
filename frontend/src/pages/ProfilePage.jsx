import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, UserRound, UserRoundSearch, Pencil, LogOut } from "lucide-react";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile, logout } = useAuthStore();

  const [selectedImg, setSelectedImg] = useState(null);
  const [editedFullName, setEditedFullName] = useState(authUser.fullName);
  const [isEditing, setIsEditing] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleFullNameUpdate = async () => {
    if (editedFullName.trim() === "" || editedFullName === authUser.fullName) {
      setIsEditing(false);
      return;
    }

    await updateProfile({
      fullName: editedFullName,
      profilePic: authUser.profilePic, // Include existing profile pic
    });

    setIsEditing(false);
  };

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-2">Your profile information</p>
          </div>

          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          {/* Info fields */}
          <div className="space-y-6">
            {/* Full name */}
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center justify-between">
                <div className="flex items-center gap-2">

                  <UserRound className="w-4 h-4" />
                  Full Name
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className=" text-zinc-500 hover:text-zinc-800"
                    aria-label="Edit full name"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="px-6 flex gap-2">
                  <input
                    type="text"
                    value={editedFullName}
                    onChange={(e) => setEditedFullName(e.target.value)}
                    className="input input-sm input-bordered w-full"
                  />
                  <button
                    onClick={handleFullNameUpdate}
                    className="btn btn-sm btn-primary"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedFullName(authUser.fullName);
                    }}
                    className="btn btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <p className="px-6">{authUser?.fullName}</p>
              )}
            </div>


            {/* User name */}
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <UserRoundSearch className="w-4 h-4" />
                User Name
              </div>
              <p className="px-6">{authUser?.userName}</p>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-6">{authUser?.email}</p>
            </div>
          </div>

          {/* Account Info */}
          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">

              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Last Login</span>
                <span>{authUser?.lastLogin ? new Date(authUser.lastLogin).toLocaleString() : "N/A"}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Last Logout</span>
                <span>{authUser?.lastLogout ? new Date(authUser.lastLogout).toLocaleString() : "N/A"}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Total Logins</span>
                <span>{authUser?.loginCount ?? 0}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Messages Sent</span>
                <span>{authUser?.messagesSent ?? 0}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>

            </div>

            <div className="mt-8 flex justify-end">
              <button
                className="flex px-6 py-2 gap-1 items-center hover:text-red-600 hover:bg-slate-800  text-lg border rounded-lg"
                onClick={logout}>

                <LogOut className="w-6 h-6 text-red-600" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
