import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { RESTAURANT_ABI, RESTAURANT_ADDRESS } from "../BlockchainConfig";

const web3 = new Web3(Web3.givenProvider || "http://localhost7545");

function AdminPage() {
    const [bookings, setBookings] = useState([]);

    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear().toString();
        return `${day}-${month}-${year}`;
    };

    useEffect(() => {
        const fetchBookings = async () => {
            const accounts = await web3.eth.getAccounts();
            const contract = new web3.eth.Contract(
                RESTAURANT_ABI,
                RESTAURANT_ADDRESS
            );

            const restaurantId = 1; // Replace with the desired restaurantId
            const bookingIds = await contract.methods
                .getBookings(restaurantId)
                .call();
            const fetchedBookings = [];

            for (let i = 0; i < bookingIds.length; i++) {
                const bookingId = bookingIds[i];
                const booking = await contract.methods.bookings(bookingId).call();
                fetchedBookings.push(booking);
            }

            setBookings(fetchedBookings);
        };

        fetchBookings();
    }, []);

    return (
        <div style={{ backgroundColor: "#EEEDE8", minHeight: "100vh" }}>
            <h1>Admin Page</h1>
            <h2 style={{ textDecorationLine: "underline" }}>All bookings:</h2>
            <ul style={{ listStyle: "none", padding: 0 }}>
                {bookings.map((booking, index) => (
                    <li key={index}>
                        <p style={{ marginBottom: "5px" }}>
                            <span style={{ fontWeight: "bold" }}>Booking ID: </span>
                            {booking.id}
                            <br />
                            <span style={{ fontWeight: "bold" }}>Number of Guests: </span>
                            {booking.numberOfGuests}
                            <br />
                            <span style={{ fontWeight: "bold" }}>Name:</span> {booking.name}
                            <br />
                            <span style={{ fontWeight: "bold" }}>Date </span>
                            {formatDate(booking.date)}
                            <br />
                            <span style={{ fontWeight: "bold" }}>Time: </span> {booking.time}
                            <br />
                            <span style={{ fontWeight: "bold" }}>Restaurant ID: </span>{" "}
                            {booking.restaurantId}
                            <br />
                        </p>
                        {index !== bookings.length - 1 && <hr />}{" "}
                        {/* Add horizontal line separator */}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default AdminPage;