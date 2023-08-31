import { useEffect, useState } from "react";
import './App.css';
import Web3 from "web3";
import StartPage from './components/StartPage';
import BookingPage from './components/BookingPage';
import { RESTAURANT_ABI, RESTAURANT_ADDRESS } from "./BlockchainConfig";

function App() {
  const [account, setAccount] = useState();
  const [contract, setContract] = useState();
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    const getAccounts = async () => {
      const web3 = new Web3(Web3.givenProvider || "http://localhost:7545");
      const accounts = await web3.eth.getAccounts();

      console.log(accounts);
      setAccount(accounts[0]);

      const personContract = new web3.eth.Contract(
        RESTAURANT_ABI,
        RESTAURANT_ADDRESS
      );

      setContract(personContract);

    };

    if (account) return;
    getAccounts();
  });
  return (
    <div className="App">
      <StartPage />
    </div>
  );
}

export default App;
