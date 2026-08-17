import "./Hero.css";

import {
    Shirt,
    Tag,
    PawPrint,
    Heart,
    Home,
    Baby,
    Truck,
    ShieldCheck,
    Headphones,
    Gift,
    CreditCard,
    BadgePercent,
    ArrowRight
} from "lucide-react";

import Moda from "../../../assets/images/Moda.png";
import Mascotas from "../../../assets/images/Mascotas.png";
import Familia from "../../../assets/images/Familia.png";


function Hero() {

    const categories = [
        {
            id: "moda",
            title: (
                <>
                    Moda que
                    <br />
                    te representa
                </>
            ),
            description:
                "Descubre las últimas tendencias en ropa y accesorios.",
            image: Moda,
            button: "Ver moda",
            className: "hero-card--fashion",
            iconOne: Shirt,
            iconOneText: "Ropa para todos",
            iconTwo: Tag,
            iconTwoText: "Marcas top"
        },
        {
            id: "mascotas",
            title: (
                <>
                    Todo para
                    <br />
                    tu mascota
                </>
            ),
            description:
                "Encuentra todo lo que tu mejor amigo necesita en un solo lugar.",
            image: Mascotas,
            button: "Ver mascotas",
            className: "hero-card--pets",
            iconOne: PawPrint,
            iconOneText: "Mejores marcas",
            iconTwo: Heart,
            iconTwoText: "Cuidado y bienestar"
        },
        {
            id: "familia",
            title: (
                <>
                    Para toda
                    <br />
                    la familia
                </>
            ),
            description:
                "Productos para el hogar, bebés y mucho más.",
            image: Familia,
            button: "Ver familia",
            className: "hero-card--family",
            iconOne: Home,
            iconOneText: "Hogar y cocina",
            iconTwo: Baby,
            iconTwoText: "Bebés y niños"
        }
    ];

    const benefits = [
        {
            icon: Tag,
            title: "Ofertas exclusivas",
            description: "Descuentos cada semana",
            color: "coral"
        },
        {
            icon: Truck,
            title: "Envíos rápidos",
            description: "A todo el país",
            color: "orange"
        },
        {
            icon: ShieldCheck,
            title: "Pagos seguros",
            description: "Protegemos tu información",
            color: "turquoise"
        },
        {
            icon: Headphones,
            title: "Soporte 24/7",
            description: "Estamos para ayudarte",
            color: "orange"
        }
    ];



    return (
        <section className="hero">

            <div className="hero-container">

                {/* =========================================
                    TARJETAS PRINCIPALES
                ========================================= */}

                <div className="hero-categories">

                    {categories.map((category) => {

                        const IconOne = category.iconOne;
                        const IconTwo = category.iconTwo;

                        return (
                            <article
                                className={`hero-card ${category.className}`}
                                key={category.id}
                            >

                                <div className="hero-card-content">

                                    <h1>
                                        {category.title}
                                    </h1>

                                    <p>
                                        {category.description}
                                    </p>

                                    <div className="hero-card-features">

                                        <div className="hero-feature">

                                            <span className="hero-feature-icon">
                                                <IconOne size={17} />
                                            </span>

                                            <span>
                                                {category.iconOneText}
                                            </span>

                                        </div>

                                        <div className="hero-feature">

                                            <span className="hero-feature-icon">
                                                <IconTwo size={17} />
                                            </span>

                                            <span>
                                                {category.iconTwoText}
                                            </span>

                                        </div>

                                    </div>

                                    <a
                                        href={
                                            category.id === "moda"
                                                ? "/products?category=moda"
                                                : category.id === "mascotas"
                                                    ? "/products?category=mascotas"
                                                    : "/products?category=familia"
                                        }
                                        className="hero-card-button"
                                    >
                                        {category.button}
                                    </a>

                                </div>

                                <img
                                    src={category.image}
                                    alt={category.button}
                                    className="hero-card-image"
                                />

                                <span className="hero-decoration hero-decoration-one" />
                                <span className="hero-decoration hero-decoration-two" />

                            </article>
                        );
                    })}

                </div>


                {/* =========================================
                    BENEFICIOS
                ========================================= */}

                <div className="hero-benefits">

                    {benefits.map((benefit, index) => {

                        const Icon = benefit.icon;

                        return (
                            <div
                                className="hero-benefit"
                                key={benefit.title}
                            >

                                <span
                                    className={`hero-benefit-icon hero-icon-${benefit.color}`}
                                >
                                    <Icon size={21} />
                                </span>

                                <div className="hero-benefit-text">

                                    <strong>
                                        {benefit.title}
                                    </strong>

                                    <span>
                                        {benefit.description}
                                    </span>

                                </div>

                            </div>
                        );
                    })}

                </div>

            </div>

        </section>
    );
}

export default Hero;