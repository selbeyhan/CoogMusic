import logo from './logo.svg';
import './App.css';
import { useState } from 'react';


export default function MyApp() {
  const displayAbout = false;
  return (
    <MyButton/>
    if (displayAbout) {
      <AboutPage/>
    }
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

function AboutPage() {
  return (
    <>
      <h1>About</h1>
      <p>Hello there.<br />How do you do?</p>
    </>
  );
}