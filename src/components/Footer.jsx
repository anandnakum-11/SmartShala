import { Link } from 'react-router-dom';
import {
    FiFacebook,
    FiTwitter,
    FiInstagram,
    FiLinkedin,
    FiMail,
    FiPhone,
    FiMapPin,
    FiShield,
    FiLayers
} from 'react-icons/fi';

const Footer = () => {


    return (
        <footer className="footer-modern">
            <div className="container">
                <div className="footer-grid">
                    {/* Brand Column */}
                    <div className="footer-brand">
                        <div className="footer-logo-modern">
                            <img src="/logo.jpeg" alt="SmartShala" />
                            <span>SmartShala</span>
                        </div>
                        <p className="footer-desc">
                            Revolutionizing the educational landscape through sophisticated digital architecture and human-centric design. Experience world-class administration.
                        </p>
                        <div className="footer-socials">
                            <a href="#" className="social-link" aria-label="Facebook"><FiFacebook /></a>
                            <a href="#" className="social-link" aria-label="Twitter"><FiTwitter /></a>
                            <a href="#" className="social-link" aria-label="Instagram"><FiInstagram /></a>
                            <a href="#" className="social-link" aria-label="Linkedin"><FiLinkedin /></a>
                        </div>
                    </div>

                    {/* Ecosystem Column */}
                    <div className="footer-links-modern">
                        <h5>Ecosystem</h5>
                        <ul className="footer-links-list">
                            <li><Link to="/login">Institutional Access</Link></li>
                            <li><Link to="/register">Student Enrollment</Link></li>
                            <li><Link to="/register">Teacher Portal</Link></li>
                            <li><Link to="/register">Parent Connect</Link></li>
                        </ul>
                    </div>

                    {/* Governance Column */}
                    <div className="footer-links-modern">
                        <h5>Governance</h5>
                        <ul className="footer-links-list">
                            <li><Link to="#"><FiShield size={14} /> Privacy Protocol</Link></li>
                            <li><Link to="#"><FiLayers size={14} /> Terms of Service</Link></li>
                            <li><Link to="#">Compliance Standards</Link></li>
                            <li><Link to="#">System Status</Link></li>
                        </ul>
                    </div>

                    {/* Contact Column */}
                    <div className="footer-links-modern">
                        <h5>Intelligence Support</h5>
                        <ul className="footer-links-list">
                            <li className="footer-contact-item">
                                <FiMail />
                                <span>ops@smartshala.ai</span>
                            </li>
                            <li className="footer-contact-item">
                                <FiPhone />
                                <span>+1 (888) SHALA-AI</span>
                            </li>
                            <li className="footer-contact-item">
                                <FiMapPin />
                                <span>Global Digital HQ</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="footer-bottom-modern">
                    <p>&copy; {new Date().getFullYear()} SmartShala Global Operations. Built with Precision.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
