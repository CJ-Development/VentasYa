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
    Gift,
    CreditCard,
    BadgePercent,
    ArrowRight,
    Users
} from "lucide-react";

import { Link } from "react-router-dom";

import Familia from "../../../assets/images/Familia.png";
import JuguetesTecnologia from "../../../assets/images/Juguetes y Tecnologia.png";
import Accesorios from "../../../assets/images/Accesorios.png";


function Hero() {

    const categories = [
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
                "Ropa, calzado y productos para todos, ¡incluidas tus mascotas!",
            image: Familia,
            button: "Ver familia",
            link: "/products?highlight=family",
            className: "hero-card--family",
            iconOne: Users,
            iconOneText: "Hombre, mujer y niños",
            iconTwo: PawPrint,
            iconTwoText: "Mascotas"
        },
        {
            id: "juguetes-tecnologia",
            title: (
                <>
                    Juguetería y
                    <br />
                    Tecnología
                </>
            ),
            description:
                "Juguetes divertidos y la última tecnología para todos.",
            image: JuguetesTecnologia,
            button: "Ver juguetes",
            link: "/products?highlight=toys",
            className: "hero-card--fashion",
            iconOne: Gift,
            iconOneText: "Juguetes",
            iconTwo: CreditCard,
            iconTwoText: "Tecnología"
        },
        {
            id: "accesorios",
            title: (
                <>
                    Accesorios
                    <br />
                    para ti
                </>
            ),
            description:
                "Complementa tu estilo con nuestros accesorios.",
            image: Accesorios,
            button: "Ver accesorios",
            link: "/products?highlight=accessories",
            className: "hero-card--pets",
            iconOne: BadgePercent,
            iconOneText: "Ofertas",
            iconTwo: Heart,
            iconTwoText: "Tendencias"
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

                                    <Link
                                        to={category.link}
                                        className="hero-card-button"
                                    >
                                        {category.button}
                                    </Link>

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