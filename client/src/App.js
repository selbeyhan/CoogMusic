// import logo from './logo.svg'; old logo from react
import './App.css';
// import { useState } from 'react';

import { useState } from 'react';
import './App.css';

export default function MyApp() {
  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);

  // Function to fetch users when button is clicked
  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8080/users');
      const data = await response.json();
  
      console.log("🔍 API Response:", data);
  
      if (Array.isArray(data)) {
        setUsers(data);
        setShowUsers(true);
      } else {
        console.error("🚨 Unexpected API response format:", data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  

  return (
    <div className="app-container">
      {/* Logo Display */}
      <div className="logo-container">
        <img src="/coogmusiclogonobg.png" alt="CoogMusic Logo" />
      </div>

      {/* Button to Fetch Users */}
      <div className="button-container">
        <button onClick={fetchUsers}>Test Button to Display All Users</button>
      </div>

      {/* Display Users List */}
      {showUsers && (
        <div className="users-container">
          <h2>CoogMusic Users</h2>
          <ul>
            {users.map(user => (
              <li key={user.user_id}>{user.name} - {user.email}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}




/* sep function 

function MyButton() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
  }

  return (
    <div>
      <button>This is a button</button>
      <h1 onClick={handleClick}> Yes {count}</h1>
    </div>
  );
}
  */