

import { io } from "socket.io-client";

// Adjust the backend port as needed (5000 in your case)
const socket = io("http://localhost:3000", {
  withCredentials: true,
});

export default socket;