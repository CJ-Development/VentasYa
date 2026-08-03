import "./RecentActivity.css";

import {
    ShoppingCart,
    Package,
    UserPlus
} from "lucide-react";

function RecentActivity() {

    const activities = [
        {
            icon: <ShoppingCart size={18} />,
            title: "Nuevo pedido #1054",
            time: "Hace 5 minutos"
        },
        {
            icon: <Package size={18} />,
            title: "Producto agregado",
            time: "Hace 20 minutos"
        },
        {
            icon: <UserPlus size={18} />,
            title: "Nuevo usuario registrado",
            time: "Hace 1 hora"
        }
    ];

    return (

        <section className="recent-activity">

            <h2>Actividad reciente</h2>

            <div className="activity-list">

                {activities.map((item, index) => (

                    <div
                        className="activity-item"
                        key={index}
                    >

                        <div className="activity-icon">
                            {item.icon}
                        </div>

                        <div>

                            <h4>{item.title}</h4>

                            <span>{item.time}</span>

                        </div>

                    </div>

                ))}

            </div>

        </section>

    );

}

export default RecentActivity;