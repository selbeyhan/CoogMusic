const mysql = require('mysql2/promise');
const dbConfig = require('./dbConfig'); // Import DB config

async function createRandomUser() {
  const user_id = Math.random().toString(36).substring(2, 12);
  const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
  const name = names[Math.floor(Math.random() * names.length)];
  const email = `${name.toLowerCase()}${Math.floor(Math.random() * 1000)}@example.com`;
  const password = Math.random().toString(36).substring(2, 12); // Hash in production
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

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.execute(sql, values);
    console.log('✅ Random user created with ID:', user_id);
  } catch (err) {
    console.error('❌ Error creating random user:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

// Run only when explicitly called
if (require.main === module) {
  createRandomUser();
}

module.exports = { createRandomUser };

