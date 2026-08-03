import "./DashboardCard.css";

function DashboardCard({

    icon,
    title,
    value,
    extra

}) {

    return (

        <div className="dashboard-card">

            <div className="card-top">

                <div className="card-icon">

                    {icon}

                </div>

                <span className="card-title">

                    {title}

                </span>

            </div>

            <div className="card-body">

                <h2>

                    {value}

                </h2>

                <p>

                    {extra}

                </p>

            </div>

        </div>

    );

}

export default DashboardCard;