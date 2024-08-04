"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Form, Button } from "react-bootstrap";
import Image from "next/image";

const Home = () => {
  const router = useRouter();
  const [accountList, setAccountList] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  const getAccountData = async () => {
    const url = "http://localhost/api/login.php";
    // const url = "https://localhostapis.share.zrok.io/api/login.php";
    const response = await axios.get(url);
    setAccountList(response.data);
  };

  // Fetch account data
  useEffect(() => {
    getAccountData();
  }, []);

  // Update password when username changes
  // useEffect(() => {
  //   const selectedAccount = accountList.find(account => account.username === username);
  //   if (selectedAccount) {
  //     setPassword(selectedAccount.password);
  //   } else {
  //     setPassword("");
  //   }
  // }, [username, accountList]);

  const login = () => {
    if (username === "") {
      setAlertMsg("Please select account first to login!");
      return;
    }
    sessionStorage.setItem("username", username);
    router.push("./POS");
    const params = new URLSearchParams();
    params.append("username", username);
    router.push(`./POS?${params}`);
  };

  return (
    <Container
      fluid
      className="d-flex justify-content-center align-items-center"
      style={{ height: "100vh", backgroundColor: "#e60000" }}
    >
      <div className="d-flex flex-column">
        <div
          className="login-form p-4 bg-transparent shadow-lg rounded"
          style={{ width: "386px", textAlign: "center" }}
        >
          <Image
            src={"/assets/logo.png"}
            width={300}
            height={300}
            alt="chams logo"
          ></Image>
          <h3 className="mb-4, text-white">Login to Point of Sale</h3>
          <Form>
            <Form.Group controlId="username">
              <Form.Control
                as="select"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              >
                <option value="" disabled>
                  Select Username
                </option>
                {accountList.map((account, index) => (
                  <option key={index} value={account.username}>
                    {account.username}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="password" className="mt-3">
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </Form.Group>
            <Button variant="primary" onClick={login} className="w-100 mt-4">
              Login
            </Button>{" "}
            &nbsp;
            <h6 className="mb-3" style={{ color: "red" }}>
              {alertMsg}
            </h6>
          </Form>
        </div>
      </div>
    </Container>
  );
};

export default Home;
