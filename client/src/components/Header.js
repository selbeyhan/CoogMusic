import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import ProfileButton from './ProfileButton';
import HamburgerIcon from './HamburgerIcon';
import Sidebar from './Sidebar';
import './Header.css';


function Header() {
 const { isSignedIn, user } = useUser(); // Clerk authentication hook
 console.log("User state in Header:", JSON.stringify(user, null, 2)); // Debugging log to check full user object


 const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 const toggleSidebar = () => setIsSidebarOpen(prev => !prev);


 // ✅ Function to send user data to backend after sign-in
 useEffect(() => {
   if (isSignedIn && user) {
     console.log("✅ User is signed in. Sending data to backend...");


     const sendUserDataToBackend = async () => {
       const userData = {
         clerk_user_id: user.id,
         name: user.fullName || "No Name Provided",
         email: user.primaryEmailAddress?.emailAddress || "",
         password: "handled by Clerk auth", // ✅ Add password field explicitly
       };


       console.log("📤 Sending user data to backend:", userData); // ✅ Debug log before sending


       try {
         const response = await fetch("/register", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(userData),
         });


         const data = await response.json();
         console.log("✅ Server response:", data); // ✅ Log server response
       } catch (error) {
         console.error("❌ Error sending user data to backend:", error); // ❌ Log if request fails
       }
     };


     sendUserDataToBackend(); // Call the function
   } else {
     console.log("❌ No signed-in user detected.");
   }
 }, [isSignedIn, user]); // Runs when `isSignedIn` or `user` changes


 return (
   <>
     <header className="header">
       <div className="hamburger-left">
         <HamburgerIcon onClick={toggleSidebar} />
       </div>


       <div className="profile-area">
         {isSignedIn ? (
           <div className="user-info">
             <ProfileButton
               profilePicture={user.profileImageUrl || 'coogmusiclogonobg.png'}
               userId={user.id}
             />
             <SignOutButton className="logout-button" />
           </div>
         ) : (
           <Link to="/login" className="login-button">Sign In</Link>
         )}
       </div>
     </header>
    
     {/* Collapsible Sidebar */}
     <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
   </>
 );
}


export default Header;