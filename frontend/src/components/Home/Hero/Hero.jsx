import "./Hero.css";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import Banner1 from "../../../assets/images/banner1.png";
import Banner2 from "../../../assets/images/banner2.png";
import Banner3 from "../../../assets/images/banner3.png";

function Hero() {

    const slides = [
        {
            id: 1,
            badge: "Nueva colección",
            title: "Moda para toda la familia",
            description:
                "Descubre miles de productos con la mejor calidad, precios increíbles y envíos a toda Colombia.",
            image: Banner1,
        },
        {
            id: 2,
            badge: "Hasta 60% OFF",
            title: "Tecnología al mejor precio",
            description:
                "Encuentra celulares, computadores y accesorios con promociones exclusivas.",
            image: Banner2,
        },
        {
            id: 3,
            badge: "Solo por tiempo limitado",
            title: "Renueva tu hogar",
            description:
                "Muebles, decoración y electrodomésticos para transformar cada espacio.",
            image: Banner3,
        },
    ];

    const [current, setCurrent] = useState(0);

    useEffect(() => {

        const interval = setInterval(() => {

            setCurrent((prev) =>
                prev === slides.length - 1 ? 0 : prev + 1
            );

        }, 5000);

        return () => clearInterval(interval);

    }, []);

    const nextSlide = () => {

        setCurrent((prev) =>
            prev === slides.length - 1 ? 0 : prev + 1
        );

    };

    const prevSlide = () => {

        setCurrent((prev) =>
            prev === 0 ? slides.length - 1 : prev - 1
        );

    };

    return (

        <section className="hero">

            <div className="hero-container">

                <div className="hero-left">

                    <span className="hero-badge">

                        {slides[current].badge}

                    </span>

                    <h1>

                        {slides[current].title}

                    </h1>

                    <p>

                        {slides[current].description}

                    </p>

                    <div className="hero-buttons">

                        <button className="primary-btn">

                            Comprar ahora

                        </button>

                        <button className="secondary-btn">

                            Ver ofertas

                        </button>

                    </div>

                </div>

                <div className="hero-right">

                    <img
                        src={slides[current].image}
                        alt={slides[current].title}
                    />

                </div>

                <button
                    className="hero-arrow left"
                    onClick={prevSlide}
                >
                    <ChevronLeft />
                </button>

                <button
                    className="hero-arrow right"
                    onClick={nextSlide}
                >
                    <ChevronRight />
                </button>

            </div>

            <div className="hero-dots">

                {slides.map((slide, index) => (

                    <button
                        key={slide.id}
                        className={
                            current === index
                                ? "dot active"
                                : "dot"
                        }
                        onClick={() => setCurrent(index)}
                    />

                ))}

            </div>

        </section>

    );

}

export default Hero;