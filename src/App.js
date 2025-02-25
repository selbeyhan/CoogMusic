// import logo from './logo.svg'; old logo from react
import './App.css';
// import { useState } from 'react';


export default function MyApp() {
  return (
    <div className="logo-container">
      <img src="/coogmusiclogonobg.png" alt="CoogMusic Logo" />
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