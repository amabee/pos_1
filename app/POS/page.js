"use client";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Container,
  Form,
  Image,
  Table,
  Modal,
  Row,
  Col,
  Card,
  Navbar,
} from "react-bootstrap";
import { BrowserMultiFormatReader } from "@zxing/library";

const POS = () => {
  const [productList, setProductList] = useState([]);
  const [barCODE, setBarCODE] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [cash, setCash] = useState("");
  const [change, setChange] = useState(0);
  const [previousTransactions, setPreviousTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showZReportModal, setShowZReportModal] = useState(false);
  const [transactSuccess, setTransactSuccess] = useState("");
  const [barcodeNotExist, setBarcodeNotExist] = useState("");
  const [dailySales, setDailySales] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString()); // State for timestamp
  const [scanning, setScanning] = useState(false);

  const videoRef = useRef(null);

  const params = useSearchParams();
  const router = useRouter();
  const username = params.get("username");

  const saveInputRef = useRef(null);
  const barcodeInputRef = useRef(null);
  const cashInputRef = useRef(null);

  // Fetch product list from API
  const getProductFromAPI = async () => {
    try {
        const url = "http://localhost/api/pointofsale.php";
        // const url = "https://localhostapis.share.zrok.io/api/pointofsale.php";
      const response = await axios.get(url);
      setProductList(response.data);
    } catch (error) {
      console.error("Error fetching product data:", error);
    }
  };

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    const startScanner = async () => {
      if (!videoRef.current) return;
      console.log("Scanner Running...");
      try {
        await codeReader.decodeFromVideoDevice(
          null,
          videoRef.current,
          (result, error) => {
            if (result) {
              handleScan(result.text);
            }
            if (error) {
              console.error(error);
            }
          }
        );
        setScanning(true);
      } catch (error) {
        console.error("Error starting the scanner:", error);
      }
    };

    startScanner();

    return () => {
      codeReader.reset();
      setScanning(false);
    };
  }, []);

  const handleScan = (scannedBarcode) => {
    stopScanner();
    setBarCODE(scannedBarcode);
    processScannedBarcode(scannedBarcode);
  };

  const stopScanner = () => {
    setScanning(false);
  };

  const processScannedBarcode = (barCode) => {
    // Convert to string first if barCode is a number
    const code = barCode.toString();
    setBarCODE(code);
    console.log("Scanned Barcode:", code);
  };

  useEffect(() => {
    getProductFromAPI();
  }, []);

  useEffect(() => {
    const storedTransactions =
      JSON.parse(localStorage.getItem("previousTransactions")) || [];
    setPreviousTransactions(storedTransactions);
    updateDailySales(storedTransactions);
  }, []);

  const updateDailySales = (transactions) => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const dailyTotal = transactions
      .filter((transaction) => transaction.date === today)
      .reduce((total, transaction) => total + transaction.totalBalance, 0);
    setDailySales((prev) => ({ ...prev, [today]: dailyTotal }));
  };

  useEffect(() => {
    if (saveInputRef.current) {
      saveInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (quantity > 0 && barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [quantity]);

  useEffect(() => {
    console.log("Effect Triggered: barCODE:", barCODE, "quantity:", quantity);
    const timer = setTimeout(() => {
      if (barCODE.length === 4 && quantity > 0) {
        console.log("Processing Barcode:", barCODE);

        const product = productList.find(
          (p) => p.barcode === parseInt(barCODE, 10)
        );

        if (product) {
          console.log("Product Found:", product);
          const selectedProductWithQuantity = {
            ...product,
            quantity: parseInt(quantity, 10),
          };
          setSelectedProducts((prevProducts) => [
            ...prevProducts,
            selectedProductWithQuantity,
          ]);
          // Reset state after processing
          setBarCODE("");
          setQuantity("");
          setBarcodeNotExist("");
          if (saveInputRef.current) {
            saveInputRef.current.focus();
          }
        } else {
          console.log("WTF ERROR?");
          setBarcodeNotExist("Product with this barcode does not exist.");
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [barCODE, quantity, productList]);

  const calculateTotalBalance = () => {
    return selectedProducts.reduce(
      (total, product) => total + product.product_price * product.quantity,
      0
    );
  };

  const handleCashChange = () => {
    const totalBalance = calculateTotalBalance();
    const cashAmount = parseFloat(cash) || 0;
    const calculatedChange = cashAmount - totalBalance;

    if (selectedProducts.length === 0) {
      alert(
        "No products added! Please add products to start a new transaction."
      );
    } else if (calculatedChange < 0) {
      alert("Not enough cash");
      setChange(0);
    } else {
      setChange(calculatedChange);
      setTransactSuccess("Transaction successful!"); // Transaction marked as successful
    }
  };

  const printReceipt = () => {
    const receiptHTML = `
            <html>
            <head>
                <style>
                    .receipt { width: 100%; max-width: 600px; margin: auto; }
                    .header, .footer { text-align: center; }
                    .details, .products { margin: 20px; }
                    .products table { width: 100%; border-collapse: collapse; }
                    .products th, .products td { padding: 8px; text-align: center; border-bottom: 1px solid #ddd; }
                </style>
            </head>
            <body className="font-monospace">
                <div class="receipt">
                    <div class="header">
                        <h2>Cham's Convenient Store</h2>
                        <p>Transaction Date: ${new Date().toLocaleDateString()}</p>
                        <p>Cashier: ${username || "Unknown User"}</p>
                           <p className= "text-center">-------------------------------------------------------------------------------------------</p>
                    </div>
                    <div class="details">
                        <h4></h4>
                        <div class="products">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Quantity</th>
                                        <th>Barcode</th>
                                        <th>Product</th>
                                        <th>Price</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${selectedProducts
                                      .map(
                                        (product) => `
                                        <tr>
                                            <td>${product.quantity}</td>
                                            <td>${product.barcode}</td>
                                            <td>${product.product_name}</td>
                                            <td>₱${product.product_price.toFixed(
                                              2
                                            )}</td>
                                            <td>₱${(
                                              product.product_price *
                                              product.quantity
                                            ).toFixed(2)}</td>
                                        </tr>
                                    `
                                      )
                                      .join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Total Balance: ₱${calculateTotalBalance().toFixed(
                          2
                        )}</p>
                        <p>Cash Paid: ₱${parseFloat(cash) || 0}</p>
                        <p>Total Change: ₱${change.toFixed(
                          2
                        )}</p> <!-- Added Change -->
                        <p className= "text-center">-------------------------------------------------------------------------------------------</p>
                        <p>Thank you for your purchase!</p>
                    </div>
                </div>
            </body>
            </html>
        `;

    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "l" || event.key === "L") {
        handleLogout();
      } else if (event.key === "x" || event.key === "X") {
        setShowModal(true);
      } else if (event.key === "z" || event.key === "Z") {
        setShowZReportModal(true);
      } else if (event.key === "Enter") {
        handleCashChange();
      } else if (event.key === "p" || event.key === "P") {
        if (transactSuccess) {
          printReceipt(); // Only print if transaction was successful
        } else {
          alert("Please calculate the change first!");
        }
      } else if (event.key === "s" || event.key === "S") {
        if (selectedProducts.length > 0) {
          handleCashChange();
          const newTransaction = {
            username: username || "Unknown User",
            products: selectedProducts,
            totalBalance: calculateTotalBalance(),
            cashPaid: parseFloat(cash) || 0,
            change: change,
            date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
          };
          const updatedTransactions = [...previousTransactions, newTransaction];
          localStorage.setItem(
            "previousTransactions",
            JSON.stringify(updatedTransactions)
          );
          setPreviousTransactions(updatedTransactions);
          updateDailySales(updatedTransactions);
          setSelectedProducts([]);
          setCash("");
          setChange(0);
          setTransactSuccess("");
        } else {
          alert(
            "No products added! Please add products to start new transaction."
          );
        }
      } else if (event.key === "r" || event.key === "R") {
        const confirmReset = window.confirm(
          "Are you sure you want to reset transaction history?"
        );
        if (confirmReset) {
          setPreviousTransactions([]);
          localStorage.removeItem("previousTransactions");
          setDailySales({});
          alert("Previous transactions have been reset.");
        }
      } else if (event.key === "q" || event.key === "Q") {
        if (saveInputRef.current) {
          saveInputRef.current.focus();
        }
      } else if (event.key === "c" || event.key === "C") {
        if (showModal) {
          setShowModal(false);
        } else if (showZReportModal) {
          setShowZReportModal(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [
    selectedProducts,
    cash,
    change,
    previousTransactions,
    transactSuccess,
    showModal,
    showZReportModal,
  ]);

  useEffect(() => {
    if (!showModal && !showZReportModal && saveInputRef.current) {
      saveInputRef.current.focus();
    }
  }, [showModal, showZReportModal]);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString());
    };

    updateTime(); // Initial call to set time
    const timerId = setInterval(updateTime, 1000); // Update time every second

    return () => clearInterval(timerId); // Clean up interval on component unmount
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure to logout?");
    if (confirmLogout) {
      router.push("/");
    }
  };

  return (
    <>
      <Navbar
        style={{ backgroundColor: "#e60000" }}
        variant="dark"
        className="mb-4"
      >
        <Container>
          <Navbar.Brand>
            <div className="d-flex justify-content-center align-items-center">
              <Image
                src={"/assets/logo.png"}
                alt="alt"
                width={80}
                height={80}
              />
              <div className="d-flex flex-column">Convenient Store</div>
            </div>
          </Navbar.Brand>
          <Navbar.Text className="ms-auto">
            <span className="text-white">
              Hello, <span style={{ color: "#fff" }}>{username}</span>
            </span>
            <br />
            {/* <span className='text-white'>{currentTime}</span> Display timestamp */}
          </Navbar.Text>
        </Container>
      </Navbar>
      <Container>
        <Row className="w-100">
          <Col lg={4}>
            <Card
              className="h-100"
              style={{ width: "100%", border: "3px solid red" }}
            >
              <Card.Body>
                <Form>
                  <Form.Group controlId="quantity">
                    <Form.Label className="fw-bold">Quantity</Form.Label>
                    <Form.Control
                      ref={saveInputRef}
                      type="number"
                      value={quantity}
                      autoComplete="off"
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group controlId="barcode" className="mt-4 mb-2">
                    <Form.Label className="fw-bold">Barcode</Form.Label>
                    <Form.Control
                      ref={barcodeInputRef}
                      type="number"
                      value={barCODE}
                      autoComplete="off"
                      onChange={(e) => setBarCODE(e.target.value)}
                    />
                  </Form.Group>
                </Form>
                <p style={{ color: "green", textAlign: "left" }}>
                  {barcodeNotExist}
                </p>
                <div
                  id="scanner-container"
                  style={{ display: scanning ? "block" : "none" }}
                ></div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={8}>
            <Card className="h-100" style={{ border: "3px solid red" }}>
              <Card.Body>
                <div>
                  <div
                    id="scanner-container"
                    style={{ width: "100%", height: "100%" }}
                  ></div>
                  <video
                    ref={videoRef}
                    style={{
                      width: "25%",
                      height: "25%",
                      display:"flex",
                    }}
                  />
                  {barCODE && <p>Detected Barcode: {barCODE}</p>}
                  {barcodeNotExist && <p>{barcodeNotExist}</p>}
                </div>
                <Table striped bordered hover variant="dark">
                  <thead>
                    <tr>
                      <th>Quantity</th>
                      <th>Barcode</th>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProducts.map((product, index) => (
                      <tr key={index}>
                        <td>{product.quantity}</td>
                        <td>{product.barcode}</td>
                        <td>{product.product_name}</td>
                        <td>₱{product.product_price.toFixed(2)}</td>
                        <td>
                          ₱
                          {(product.product_price * product.quantity).toFixed(
                            2
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <h3 style={{ textAlign: "end" }}>
                  Total Balance: ₱{calculateTotalBalance().toFixed(2)}
                </h3>

                <Form.Group controlId="cash" className="mt-3">
                  <Form.Label className="fw-bold">Pay Cash</Form.Label>
                  <Form.Control
                    ref={cashInputRef}
                    type="number"
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                  />
                </Form.Group>

                <h5 style={{ color: "green" }}>{transactSuccess}</h5>

                <h3 style={{ textAlign: "end" }}>
                  Total Change:{" "}
                  <span style={{ color: "red" }}>₱{change.toFixed(2)}</span>
                </h3>
              </Card.Body>
            </Card>
          </Col>

          {/* Shift Reports Modal */}
          <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
            <Modal.Header>
              <Modal.Title>Shift Reports</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {previousTransactions.length > 0 ? (
                previousTransactions.map((transaction, index) => (
                  <div key={index} className="mb-3">
                    <h6>
                      <span style={{ color: "gray" }}>Cashier name:</span>{" "}
                      <span
                        style={{
                          textDecorationLine: "underline",
                          fontWeight: "bold",
                        }}
                      >
                        {transaction.username}
                      </span>
                    </h6>
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>Quantity</th>
                          <th>Product</th>
                          <th>Price</th>
                          <th>Total Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transaction.products.map((product, prodIndex) => (
                          <tr key={prodIndex}>
                            <td>{product.quantity}</td>
                            <td>{product.product_name}</td>
                            <td>₱{product.product_price.toFixed(2)}</td>
                            <td>
                              ₱
                              {(
                                product.product_price * product.quantity
                              ).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={3}>
                            <h6>Total Balance:</h6>
                          </td>
                          <td>₱{transaction.totalBalance.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colSpan={3}>
                            <h6>Cash Paid:</h6>
                          </td>
                          <td>₱{transaction.cashPaid.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colSpan={3}>
                            <strong>Total Change:</strong>
                          </td>
                          <td>
                            <strong style={{ color: "green" }}>
                              ₱{transaction.change.toFixed(2)}
                            </strong>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                ))
              ) : (
                <p>No previous transactions found.</p>
              )}
            </Modal.Body>
          </Modal>

          {/* Z Report Modal */}
          <Modal
            show={showZReportModal}
            onHide={() => setShowZReportModal(false)}
            size="lg"
          >
            <Modal.Header>
              <Modal.Title>Z Report</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <h5>Daily Sales Report</h5>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(dailySales).length > 0 ? (
                    Object.keys(dailySales).map((date, index) => (
                      <tr key={index}>
                        <td>{date}</td>
                        <td>₱{dailySales[date].toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2}>No sales data available for today.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Modal.Body>
          </Modal>
        </Row>
      </Container>
    </>
  );
};

export default POS;
