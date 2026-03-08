import LoginSection from "../components/login/LoginSection";
import background from "../assets/images/about-us-hero.png"


export default function LoginPage() {
    return (
        <section
            style={{ backgroundImage: `url(${background})` }}
            className="flex items-center justify-center bg-cover bg-no-repeat bg-center min-h-screen"
        >
            <LoginSection />
        </section>
    );
}