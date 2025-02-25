import logo from './logo.svg';
import './App.css';
import { useState } from 'react';


export default function MyApp() {
  return (
    <div>
      <h1>GOATED ACTIVITES</h1>
      <a href="https://reactjs.org">learn react</a>  {/* apparently this needs to be added for build/deploy step */}
      <MyButton />
      <img src={logo} alt="Logo" />
    </div>
  );
}


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