import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { RESTAURANT_ABI, RESTAURANT_ADDRESS } from "../BlockchainConfig";
import StartPage from "./StartPage";

const web3 = new Web3(Web3.givenProvider || "http://localhost:7545");

function BookingPage() {
    const [account, setAccount] = useState("");
    const [contract, setContract] = useState(null);
    const [date, setDate] = useState("");
    const [numGuests, setNumGuests] = useState(1);
    const [bookings, setBookings] = useState([]);
    const [availabilityStatus, setAvailabilityStatus] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [showStartPage, setShowStartPage] = useState(false);
    const [error, setError] = useState("");
    const [gdprChecked, setGdprChecked] = useState(false);

    const MAX_GUESTS_PER_TABLE = 6;
    const TOTAL_TABLES = 15;
    const MAX_GUESTS_PER_TIME = MAX_GUESTS_PER_TABLE * TOTAL_TABLES;

    useEffect(() => {
        const initializeContract = async () => {
            const accounts = await web3.eth.getAccounts();
            setAccount(accounts[0]);
            const restaurantContract = new web3.eth.Contract(
                RESTAURANT_ABI,
                RESTAURANT_ADDRESS
            );
            setContract(restaurantContract);
        };

        initializeContract();
    }, []);

    useEffect(() => {
        const fetchBookings = async () => {
            if (contract) {
                const restaurantId = 1;
                const bookingIds = await contract.methods
                    .getBookings(restaurantId)
                    .call();
                const fetchedBookings = [];

                for (let i = 0; i < bookingIds.length; i++) {
                    const bookingId = bookingIds[i];
                    const booking = await contract.methods.bookings(bookingId).call();
                    fetchedBookings.push(booking);
                }

                const filteredBookings = fetchedBookings.filter(
                    (booking) => booking.date === date
                );

                setBookings(filteredBookings);
            }
        };

        fetchBookings();
    }, [date, contract]);

    const handleBack = () => {
        setShowStartPage(true);
    };

    const handleCheckAvailability = async () => {
        if (
            !date ||
            !numGuests ||
            numGuests < 1 ||
            numGuests > MAX_GUESTS_PER_TABLE
        ) {
            setError(
                `Please select a valid date and number of guests (1-${MAX_GUESTS_PER_TABLE}).`
            );
            return;
        }

        setError("");

        const bookingsForSelectedDate = bookings.filter(
            (booking) => booking.date === date
        );

        const availableTimeslots = ["18:00", "21:00"];

        const availableTimes = availableTimeslots.filter((timeslot) => {
            const guestsForTime = bookingsForSelectedDate
                .filter((booking) => booking.time === timeslot)
                .reduce((acc, booking) => acc + parseInt(booking.numGuests), 0);
            return guestsForTime + parseInt(numGuests) <= MAX_GUESTS_PER_TIME;
        });

        if (availableTimes.length === 0) {
            setAvailabilityStatus("full");
        } else {
            setAvailabilityStatus("available");
        }
    };

    const handleTimeSelection = (time) => {
        setSelectedTime(time);
    };

    const handleBook = async () => {
        if (!gdprChecked) {
            setError("Please agree to the GDPR terms and conditions.");
            return;
        }

        if (
            !selectedTime ||
            !numGuests ||
            numGuests < 1 ||
            numGuests > MAX_GUESTS_PER_TABLE
        ) {
            setError(
                `Please select a valid time and number of guests (1-${MAX_GUESTS_PER_TABLE}).`
            );
            return;
        }

        setError("");

        const dateObj = new Date(date);
        const unixTimestamp = Math.floor(dateObj.getTime() / 1000);
        const dateBN = web3.utils.toBN(unixTimestamp);
        const selectedTimeBN = web3.utils.toBN(selectedTime.replace(":", ""));

        const bookingsForTime = bookings.filter(
            (booking) =>
                booking.date === dateBN.toString() && booking.time === selectedTime
        );

        const totalGuestsForTime = bookingsForTime.reduce(
            (acc, booking) => acc + parseInt(booking.numGuests),
            0
        );

        if (totalGuestsForTime + parseInt(numGuests) > MAX_GUESTS_PER_TIME) {
            setError("The maximum guests limit for this timeslot has been reached.");
            return;
        }

        await contract.methods
            .createBooking(
                numGuests,
                account,
                dateBN.toString(),
                selectedTimeBN.toString(),
                1
            )
            .send({ from: account });

        console.log("Booking created successfully!");

        const newBooking = {
            date: dateBN.toString(),
            time: selectedTime,
            numGuests,
        };
        setBookings([...bookings, newBooking]);
    };

    if (showStartPage) {
        return <StartPage />;
    }

    return (
        <div style={{ backgroundColor: "#EEEDE8", minHeight: "100vh" }}>
            <div style={{ padding: "20px" }}>
                <button
                    style={{ position: "fixed", top: "20px", left: "20px" }}
                    onClick={handleBack}
                >
                    Back
                </button>
                <h2>Booking</h2>
                <label>
                    Select a date:
                    <input type="date" onChange={(e) => setDate(e.target.value)} />
                </label>
                <label>
                    Number of guests:
                    <input
                        type="number"
                        value={numGuests}
                        onChange={(e) => setNumGuests(e.target.value)}
                        min={1}
                        max={MAX_GUESTS_PER_TABLE}
                    />
                </label>

                <label>
                    GDPR Consent:
                    <input
                        type="checkbox"
                        checked={gdprChecked}
                        onChange={() => setGdprChecked(!gdprChecked)}
                    />
                    I agree to the GDPR terms and conditions.
                </label>

                <button onClick={handleCheckAvailability}>Check availability</button>

                {availabilityStatus === "available" && (
                    <div style={{ marginTop: "20px" }}>
                        <p>Available Timeslots:</p>
                        {["18:00", "21:00"].map((time) => (
                            <button key={time} onClick={() => handleTimeSelection(time)}>
                                {time}
                            </button>
                        ))}
                    </div>
                )}

                {availabilityStatus === "full" && (
                    <p style={{ marginTop: "20px" }}>
                        No available timeslots for the selected date. Fully booked.
                    </p>
                )}

                {availabilityStatus === "unavailable" && (
                    <p>No available timeslots for the selected date.</p>
                )}

                {selectedTime && (
                    <div style={{ marginTop: "20px" }}>
                        <p>Selected Timeslot: {selectedTime}</p>
                        <button onClick={handleBook}>Book</button>
                    </div>
                )}

                {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
        </div>
    );
}

export default BookingPage;
