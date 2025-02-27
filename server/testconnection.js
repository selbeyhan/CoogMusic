const mysql = require('mysql2');
const fs = require('fs');
const util = require('util');

// Create a connection to Azure MySQL
const connection = mysql.createConnection({
  host: "coogsmusic-database-server.mysql.database.azure.com",
  user: "selbeyhan",
  password: "1234801&$@)HJFDS92h",
  database: "main_database",
  port: 3306,
  ssl: {
    ca: fs.readFileSync("DigiCertGlobalRootCA.crt.pem")
  }
});

const connectAsync = util.promisify(connection.connect).bind(connection);

async function runDatabaseOperations() {
  try {
    await connectAsync();
    console.log("✅ Connected to Azure MySQL successfully!");

    // await createRandomUser();

    // Convert to promise-based interface
    const promiseConn = connection.promise();
    const [rows] = await promiseConn.execute('SELECT * FROM Users');
    console.log('Data received from Db:');
    console.log(rows);
  } catch (err) {
    console.error('Database operation error:', err.message);
  } finally {
    connection.end();
  }
}

runDatabaseOperations();
// Function to get all users
async function getAllUsers() {
    let connection;
    try {
        // Create a new database connection     optimize so that connection is only done once
        connection = await mysql.createConnection({
            host: "coogsmusic-database-server.mysql.database.azure.com",
            user: "selbeyhan",
            password: "1234801&$@)HJFDS92h",
            database: "main_database",
            port: 3306,
            ssl: {
                ca: fs.readFileSync("DigiCertGlobalRootCA.crt.pem")
            }
        });

        // Use promise-based connection for better async handling
        const promiseConn = connection.promise();
        const [rows] = await promiseConn.execute('SELECT * FROM Users');

        // Debugging logs
        console.log("🟢 Users fetched from DB:", rows);
        console.log("🟡 Type of rows:", typeof rows);
        console.log("🟠 Is rows an array?", Array.isArray(rows));

        // Ensure rows is an array before returning
        if (!Array.isArray(rows)) {
            console.error("🚨 Unexpected response format:", rows);
            return []; // Return empty array to prevent frontend errors
        }

        return rows;
    } catch (err) {
        console.error("❌ Error fetching users:", err.message);
        return []; // Return an empty array on error
    } finally {
        if (connection) await connection.end(); // Close connection properly
    }
}
  

async function createRandomUser() {
  // Generate random data for the user
  const user_id = Math.random().toString(36).substring(2, 12);
  const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
  const name = names[Math.floor(Math.random() * names.length)];
  const email = `${name.toLowerCase()}${Math.floor(Math.random() * 1000)}@example.com`;
  const password = Math.random().toString(36).substring(2, 12); // For demo purposes (hash in production!)
  const account_type = ['Listener', 'Musician'][Math.floor(Math.random() * 2)];
  const registration_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const profile_picture_url = 'https://via.placeholder.com/150';
  const bios = [
    'Loves music and live concerts.',
    'Passionate about playing guitar.',
    'Enjoys singing and songwriting.',
    'Avid concert-goer and music lover.',
    'Music is life.'
  ];
  const bio = bios[Math.floor(Math.random() * bios.length)];
  const monthly_listeners = Math.floor(Math.random() * 100001);
  const uh_affiliations = ['Student', 'Alumni', 'Staff', 'None'];
  const uh_affiliation = uh_affiliations[Math.floor(Math.random() * uh_affiliations.length)];
  const verification_status = Math.random() < 0.5 ? 0 : 1;
  const admin_role = Math.random() < 0.5 ? 0 : 1;

  const sql = `
    INSERT INTO Users (
      user_id, name, email, password, account_type,
      registration_date, profile_picture_url, bio,
      monthly_listeners, uh_affiliation, verification_status, admin_role
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    user_id, name, email, password, account_type,
    registration_date, profile_picture_url, bio,
    monthly_listeners, uh_affiliation, verification_status, admin_role
  ];

  try {
    await connection.execute(sql, values);
    console.log('Random user created with ID:', user_id);
  } catch (err) {
    console.error('Error creating random user:', err.message);
  }
}

module.exports = { getAllUsers };
