"use client";

import React from 'react';

// WaitingRoomPage Component
const WaitingRoomPage = () => {
  // Function to handle logout and revoke user session
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default link behavior

    try {
      // Send a request to the API endpoint to revoke the session
      const response = await fetch('/api/revoke-session', {
        method: 'GET',
      });

      if (response.ok) {
        alert('You have been logged out.');
        // Redirect to login page or home page after successful logout
        window.location.href = '/';
      } else {
        alert('Failed to log out. Please try again.');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="waiting-room-page">
      <h1 className="text-xl font-bold">Waiting Room</h1>
      <p>Welcome to the waiting room. Please wait while we process your access.</p>
      <a
        href="#"
        className="text-red-500 hover:text-red-700 underline"
        onClick={handleLogout}
      >
        Logout
      </a>
    </div>
  );
};

export default WaitingRoomPage;
