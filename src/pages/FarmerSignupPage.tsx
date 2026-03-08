import FarmerSignup from "../components/signup/FarmerSignup";
import background from '../assets/images/about-us-hero.png'
export default function SignupPage() {
    return (
        <section
            style={{ backgroundImage: `url(${background})` }}
            className="flex items-center justify-center bg-cover bg-no-repeat bg-center min-h-screen"
        >
            <FarmerSignup />
        </section>
    );
}
