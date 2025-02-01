import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient'; // Import your Supabase client

const App = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);  // Start loading

      try {
        // Try fetching data from Supabase
        const { data, error } = await supabase
          .from('game_sequence')  // Replace with your table name
          .select('*');  // Fetch all columns

        // Check for errors in the Supabase query
        if (error) {
          console.error("Supabase Error:", error);
          setError(error.message);  // Store error message in state
          setLoading(false);
          return;
        }

        // If data is returned, set it in the state
        if (data && data.length > 0) {
          setData(data);
        } else {
          setError('No data found in the table');
        }
        setLoading(false);  // Done loading

      } catch (err) {
        // Catch any unexpected errors
        console.error("Unexpected Error:", err);
        setError('An unexpected error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, []);  // Empty array ensures this runs once on mount

  // If there's an error, display it
  if (error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  // If data is loading, show a loading message
  if (loading) {
    return <div>Loading...</div>;
  }

  // If no error and data is available, display the data
  return (
    <div>
      <h1>Fetched Data</h1>
      <ul>
        {data.map((item, index) => (
          <li key={index}>
            {/* Replace 'column_name' with the actual column name from your table */}
            {item.player_num || 'No data available'}  
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
