import Web3 from "web3";
import { RESTAURANT_ADDRESS, RESTAURANT_ABI } from "./BlockchainConfig";

const web3 = new Web3(Web3.givenProvider || "http://localhost:7545");

const getAccount = async () => {
    const accounts = await web3.eth.getAccounts();
    return accounts[0];
};

const getContract = async () => {
    const account = await getAccount();
    const contract = new web3.eth.Contract(RESTAURANT_ABI, RESTAURANT_ADDRESS);
    return { account, contract };
};

const getBookingsByRestaurant = async (restaurantId) => {
    try {
        const { contract } = await getContract();
        const bookingCount = await contract.methods.bookingCount().call();
        const bookings = [];

        for (let i = 1; i <= bookingCount; i++) {
            const booking = await contract.methods.bookings(i).call();
            if (booking.id && booking.name && booking.restaurantId === restaurantId) {
                bookings.push(booking);
            }
        }

        console.log('bookingCount', bookingCount);
        console.log('bookings', bookings);

        return bookings;
    } catch (error) {
        console.error("Error getting bookings:", error);
        return [];
    }
};

const createRestaurant = async (name) => {
    try {
        const { account, contract } = await getContract();

        const response = await contract.methods.createRestaurant(name).send({ from: account });
        const restaurantId = response.events.RestaurantCreated.returnValues.id;

        return restaurantId;
    } catch (error) {
        console.error("Error creating restaurant:", error);
        throw error;
    }
};

const addBooking = async (oneBooking) => {
    try {
        const { account, contract } = await getContract();
        const { numberOfGuests, name, date, time, restaurantId } = oneBooking;

        const response = await contract.methods.createBooking(
            parseInt(numberOfGuests),
            name,
            date,
            parseInt(time),
            parseInt(restaurantId)
        ).send({ from: account });

        const { events } = response;
        if (events.BookingCreated) {
            console.log("Booking created successfully:", events.BookingCreated.returnValues);
            return events.BookingCreated.returnValues;
        } else {
            console.error("Booking creation failed");
            throw new Error("Booking creation failed");
        }

    } catch (error) {
        console.error("Error creating booking:", error);
        throw error;
    }
};

const removeBooking = async (id) => {
    try {
        const { account, contract } = await getContract();
        await contract.methods.removeBooking(id).send({ from: account });
        return true;
    } catch (error) {
        console.error("Error removing booking:", error);
        throw error;
    }
};

const changeBooking = async (oneBooking) => {
    try {
        const { account, contract } = await getContract();
        const { id, numberOfGuests, name, date, time } = oneBooking;

        await contract.methods.editBooking(
            id,
            numberOfGuests,
            name,
            date,
            time
        ).send({ from: account });

        return true;
    } catch (error) {
        console.error("Error editing booking:", error);
        throw error;
    }
};

export const BlockchainService = {
    getBookingsByRestaurant,
    createRestaurant,
    addBooking,
    removeBooking,
    changeBooking,
};

export default BlockchainService;