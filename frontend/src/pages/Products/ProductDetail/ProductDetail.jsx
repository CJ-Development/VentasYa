import "./ProductDetail.css";
import { useParams } from "react-router-dom";
import { Heart, ShoppingCart, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import NoImage from "../../../assets/images/no-detail.png";

function ProductDetail() {
  const { id } = useParams();

  return (
    <main className="product-detail">
      <section className="product-container">

        <section className="product-gallery">
          <aside className="gallery-thumbnails">
            <img src={NoImage} alt="" />
            <img src={NoImage} alt="" />
            <img src={NoImage} alt="" />
            <img src={NoImage} alt="" />
          </aside>

          <div className="gallery-main">
            <img src={NoImage} alt="Producto" />
          </div>
        </section>

        <section className="product-info">

          <span className="product-category">HOMBRE</span>

          <h1>Camiseta Oversize Premium</h1>

          <p className="product-reference">
            Referencia #{id}
          </p>

          <div className="product-price">
            $129.900
          </div>

          <div className="product-description">
            Camiseta elaborada en algodón premium con acabado suave, corte oversize y costuras reforzadas para mayor comodidad y durabilidad.
          </div>

          <h4 className="option-title">COLOR DISPONIBLE</h4>

          <div className="colors">
            <span className="color black"></span>
            <span className="color white"></span>
            <span className="color green"></span>
          </div>

          <h4 className="option-title">TALLA</h4>

          <div className="sizes">
            <button>S</button>
            <button>M</button>
            <button className="active">L</button>
            <button>XL</button>
          </div>

          <h4 className="option-title">CANTIDAD</h4>

          <div className="quantity">
            <button>-</button>
            <span>1</span>
            <button>+</button>
          </div>

          <div className="services">
            <span><Truck size={16}/> Envíos</span>
            <span><RotateCcw size={16}/> 30 días</span>
            <span><ShieldCheck size={16}/> Compra segura</span>
          </div>

          <div className="buttons">
            <button className="buy-button">
              <ShoppingCart size={18}/>
              Agregar al carrito
            </button>

            <button className="favorite">
              <Heart size={20}/>
            </button>
          </div>

        </section>

      </section>
    </main>
  );
}

export default ProductDetail;
