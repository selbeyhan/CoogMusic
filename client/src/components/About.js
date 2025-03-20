import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-container">
      <div className="logo-container">
        <img
          src="/coogmusiclogonobg.png"
          alt="CoogMusic Logo"
          className="coogmusic-logo"
        />
      </div>

      <section className="about-section">
        <h1>About CoogMusic</h1>
        <p>
          CoogMusic is the University of Houston's premier music streaming platform,
          designed specifically for the UH community. Our mission is to connect UH musicians
          with their audience and provide a platform for creative expression.
        </p>
      </section>

      <section className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>UH Artist Showcase</h3>
            <p>Discover talented musicians from the University of Houston community.</p>
          </div>
          <div className="feature-card">
            <h3>Music Streaming</h3>
            <p>Stream high-quality music directly from our platform.</p>
          </div>
          <div className="feature-card">
            <h3>Playlist Creation</h3>
            <p>Create and share custom playlists with your favorite UH tracks.</p>
          </div>
          <div className="feature-card">
            <h3>Artist Uploads</h3>
            <p>Musicians can upload and share their original music with the community.</p>
          </div>
        </div>
      </section>

      <section className="team-section">
  <h2>Our Team</h2>
  <div className="team-grid">
    <div className="team-member">
      <div className="member-photo">
        <img src="/team/adem_team_coogmusic.png" alt="Adem Beyhan" />
      </div>
      <h3>Adem Beyhan</h3>
      <p>Computer Science Major</p>
    </div>
    <div className="team-member">
      <div className="member-photo">
        <img src="/team/janred_team_coogmusic.jpg" alt="Janred Salubayba" />
      </div>
      <h3>Janred Salubayba</h3>
      <p>Computer Science Major</p>
    </div>
    <div className="team-member">
      <div className="member-photo">
        <img src="/team/nate_team_coogmusic.png" alt="Nate" />
      </div>
      <h3>Nathaniel Nguyen</h3>
      <p>Computer Science Major</p>
    </div>
    <div className="team-member">
      <div className="member-photo">
        <img src="/team/brandon_team_coogmusic.png" alt="Brandon Tobar" />
      </div>
      <h3>Brandon Tobar</h3>
      <p>Computer Science Major</p>
    </div>
    <div className="team-member">
      <div className="member-photo">
        <img src="/team/joseph_team_coogmusic.jpg" alt="Joseph Mascardo" />
      </div>
      <h3>Joseph Mascardo</h3>
      <p>Computer Science Major</p>
    </div>
  </div>
</section>

      <section className="contact-section">
        <h2>Contact Us</h2>
        <p>Have questions or suggestions? Reach out to us at:</p>
        <a href="mailto:contact@coogmusic.uh.edu">contact@coogmusic.uh.edu</a>
      </section>
    </div>
  );
};

export default About;